use crate::{
    AppState,
    db::UserExt,
    dtos::{RegisterUserDto, Response},
    error::{ErrorMessage, HttpError},
    utils::{keys::generate_key, password},
};
use axum::{Extension, Json, http::StatusCode, response::IntoResponse};
use std::sync::Arc;
use validator::Validate;

pub async fn register(
    Extension(app_state): Extension<Arc<AppState>>,
    Json(body): Json<RegisterUserDto>,
) -> Result<impl IntoResponse, HttpError> {
    body.validate()
        .map_err(|e| HttpError::bad_request(e.to_string()))?;

    let has_password =
        password::hash(&body.password).map_err(|e| HttpError::server_error(e.to_string()))?;

    let result = app_state
        .db_client
        .save_user(&body.name, &body.email, &has_password)
        .await;

    match result {
        Ok(user) => {
            let _key_result = generate_key(app_state, user).await?;

            Ok((
                StatusCode::CREATED,
                Json(Response {
                    message: "Registration successfull!".to_owned(),
                    status: "success",
                }),
            ))
        }
        Err(sqlx::Error::Database(db_err)) => {
            if db_err.is_unique_violation() {
                Err(HttpError::unique_constraint_voilation(
                    ErrorMessage::EmailExist.to_string(),
                ))
            } else {
                Err(HttpError::server_error(db_err.to_string()))
            }
        }
        Err(e) => Err(HttpError::server_error(e.to_string())),
    }
}
