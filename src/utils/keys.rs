// generate 2048 bit rsa key file
use axum::{
    Extension, Json,
    body::Body,
    http::{Response, StatusCode},
    response::IntoResponse,
};
use base64::{Engine, engine::general_purpose::STANDARD};
use rsa::{
    RsaPrivateKey,
    pkcs1::{DecodeRsaPrivateKey, EncodeRsaPrivateKey},
    rand_core::OsRng,
};
use std::{
    fs::{self, File},
    io::Write,
    path::PathBuf,
    sync::Arc,
};
use validator::Validate;

use crate::{
    AppState,
    db::UserExt,
    dtos::RetrieveFileDto,
    error::HttpError,
    middleware::JWTAuthMiddleware,
    models::User,
    utils::{decrypt::decrypt_file, password},
};

const PRIVATE_KEY_DIR: &str = "assests/private_keys";

pub async fn generate_key(
    app_state: Arc<AppState>,
    user: User,
) -> Result<impl IntoResponse, HttpError> {
    let mut rng = OsRng;
    let private_key =
        RsaPrivateKey::new(&mut rng, 2048).map_err(|e| HttpError::server_error(e.to_string()))?;

    let public_key = RsaPrivateKey::from(private_key.clone());

    let private_key_pem = private_key
        .to_pkcs1_pem(rsa::pkcs1::LineEnding::LF)
        .map_err(|e| HttpError::server_error(e.to_string()))?;

    let public_key_pem = public_key
        .to_pkcs1_pem(rsa::pkcs1::LineEnding::LF)
        .map_err(|e| HttpError::server_error(e.to_string()))?;

    let public_key_b64 = STANDARD.encode(public_key_pem.as_bytes());

    let user_id = uuid::Uuid::parse_str(&user.id.to_string()).unwrap();

    app_state
        .db_client
        .save_user_key(user_id.clone(), public_key_b64.clone())
        .await
        .map_err(|e| HttpError::server_error(e.to_string()))?;

    fs::create_dir_all(PRIVATE_KEY_DIR).map_err(|e| HttpError::server_error(e.to_string()))?;

    let pem_file_path = format!("{}/{}.pem", PRIVATE_KEY_DIR, user_id.clone());

    let mut file =
        File::create(&pem_file_path).map_err(|e| HttpError::server_error(e.to_string()))?;

    file.write_all(private_key_pem.as_bytes())
        .map_err(|e| HttpError::server_error(e.to_string()))?;

    Ok((StatusCode::OK, "true"))
}

pub async fn retrieve_file(
    Extension(app_state): Extension<Arc<AppState>>,
    Extension(user): Extension<JWTAuthMiddleware>,
    Json(body): Json<RetrieveFileDto>,
) -> Result<impl IntoResponse, HttpError> {
    body.validate()
        .map_err(|e| HttpError::bad_request(e.to_string()))?;

    let user_id = uuid::Uuid::parse_str(&user.user.id.to_string()).unwrap();
    let shared_id = uuid::Uuid::parse_str(&body.shared_id.to_string()).unwrap();

    let shared_result = app_state
        .db_client
        .get_shared(shared_id, user_id.clone())
        .await
        .map_err(|e| HttpError::server_error(e.to_string()))?;

    let shared_data = shared_result.ok_or_else(|| {
        HttpError::bad_request("The requested shared link either does not exist or has expired.")
    })?;

    let match_password = password::compare(&body.password, &shared_data.password)
        .map_err(|e| HttpError::server_error(e.to_string()))?;

    if !match_password {
        return Err(HttpError::bad_request(
            "The provided password is incorrect".to_string(),
        ));
    };

    let file_id = match shared_data.file_id {
        Some(id) => id,
        None => {
            return Err(HttpError::bad_request("File Id Is missing".to_string()));
        }
    };

    let file_result = app_state
        .db_client
        .get_file(file_id)
        .await
        .map_err(|e| HttpError::server_error(e.to_string()))?;

    let file_data = file_result.ok_or_else(|| {
        HttpError::bad_request(
            "The requested file wither does not exist or has expired.".to_string(),
        )
    })?;

    let mut path = PathBuf::from(PRIVATE_KEY_DIR);
    path.push(format!("{}.pem", user_id));

    let private_key =
        fs::read_to_string(&path).map_err(|e| HttpError::server_error(e.to_string()))?;

    let privatye_key_pem = RsaPrivateKey::from_pkcs1_pem(&private_key)
        .map_err(|e| HttpError::server_error(e.to_string()))?;

    let decrypted_file = decrypt_file(
        &file_data.encrypted_aes_key,
        &file_data.encrypted_file,
        &file_data.iv,
        &privatye_key_pem,
    )?;

    let response = Response::builder()
        .status(StatusCode::OK)
        .header(
            "Content_Disposition",
            format!("attachment; filename=\"{}\"", file_data.file_name),
        )
        .header("Content-Type", "application/octet-stream")
        .body(Body::from(decrypted_file))
        .map_err(|e| HttpError::server_error(e.to_string()))?;

    Ok(response)
}
