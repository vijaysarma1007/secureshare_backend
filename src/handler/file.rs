use crate::{
    AppState,
    db::UserExt,
    dtos::{FileUploadDtos, Response},
    error::HttpError,
    middleware::JWTAuthMiddleware,
    utils::{encrypt::encrypt_file, password},
};
use axum::{Extension, Json, response::IntoResponse};
use axum_extra::extract::Multipart;
use base64::{Engine, engine::general_purpose::STANDARD};
use chrono::{DateTime, Utc};
use rsa::{RsaPublicKey, pkcs1::DecodeRsaPublicKey};
use std::sync::Arc;
use validator::Validate;

pub async fn upload_files(
    Extension(app_state): Extension<Arc<AppState>>,
    Extension(user): Extension<JWTAuthMiddleware>,
    mut multipart: Multipart,
) -> Result<impl IntoResponse, HttpError> {
    let mut file_data = Vec::new();
    let mut file_name = String::new();
    let mut file_size = 0 as i64;
    let mut form_data = FileUploadDtos {
        recipient_email: String::new(),
        password: String::new(),
        expiration_date: String::new(),
    };

    while let Some(field) = multipart.next_field().await.unwrap() {
        let name = field.name().unwrap().to_string();

        match name.as_str() {
            "fileUpload" => {
                file_name = field.file_name().unwrap_or("unknown_file").to_string();
                file_data = field.bytes().await.unwrap().to_vec();
                file_size = file_data.len() as i64;
            }
            "recipient_email" => {
                form_data.recipient_email = field.text().await.unwrap();
            }
            "password" => {
                form_data.password = field.text().await.unwrap();
            }
            "expiration_date" => {
                form_data.expiration_date = field.text().await.unwrap();
            }
            _ => {}
        }
    }

    form_data
        .validate()
        .map_err(|e| HttpError::bad_request(e.to_string()))?;

    let recipient_result = app_state
        .db_client
        .get_user(None, None, Some(&form_data.recipient_email))
        .await
        .map_err(|e| HttpError::server_error(e.to_string()))?;

    let recipient_user =
        recipient_result.ok_or(HttpError::bad_request("Recipient user not found"))?;

    let public_key_str = match &recipient_user.public_key {
        Some(key) => key,
        None => return Err(HttpError::bad_request("Receipient has no public key")),
    };

    let public_key_bytes = STANDARD
        .decode(public_key_str)
        .map_err(|e| HttpError::server_error(e.to_string()))?;

    let public_key =
        String::from_utf8(public_key_bytes).map_err(|e| HttpError::server_error(e.to_string()))?;

    let public_key_pem = RsaPublicKey::from_pkcs1_pem(&public_key)
        .map_err(|e| HttpError::server_error(e.to_string()))?;

    let (encrypyted_aes_key, encrypyted_data, iv) = encrypt_file(&file_data, &public_key_pem)?;

    let user_id = uuid::Uuid::parse_str(&user.user.id.to_string()).unwrap();

    let hash_password =
        password::hash(&form_data.password).map_err(|e| HttpError::server_error(e.to_string()))?;

    let expiration_date = DateTime::parse_from_rfc3339(&form_data.expiration_date)
        .map_err(|e| HttpError::server_error(e.to_string()))?
        .with_timezone(&Utc);

    let receipient_user_id = uuid::Uuid::parse_str(&recipient_user.id.to_string()).unwrap();

    app_state
        .db_client
        .save_encrypted_file(
            user_id,
            file_name,
            file_size,
            receipient_user_id,
            hash_password,
            expiration_date,
            encrypyted_aes_key,
            encrypyted_data,
            iv,
        )
        .await
        .map_err(|e| HttpError::server_error(e.to_string()))?;

    let response = Response {
        message: "File uploaded and encrypted successfully".to_string(),
        status: "success",
    };

    Ok(Json(response))
}
