// generate 2048 bit rsa key file
use axum::{http::StatusCode, response::IntoResponse};
use base64::{Engine, engine::general_purpose::STANDARD};
use rsa::{RsaPrivateKey, pkcs1::EncodeRsaPrivateKey, rand_core::OsRng};
use std::{
    fs::{self, File},
    io::Write,
    sync::Arc,
};

use crate::{AppState, db::UserExt, error::HttpError, models::User};

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
