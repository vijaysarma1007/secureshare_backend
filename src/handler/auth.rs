use crate::{
    AppState,
    db::UserExt,
    dtos::{LoginUserDto, RegisterUserDto, Response, UserLoginResponseDto},
    error::{ErrorMessage, HttpError},
    utils::{keys::generate_key, password, token},
};
use axum::{
    Extension, Json, handler,
    http::{HeaderMap, StatusCode, header},
    response::IntoResponse,
};
use axum_extra::extract::cookie;
use std::sync::Arc;
use validator::Validate;

//register a user
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

//login a user and generate jwt token if login is successful.
pub async fn login(
    Extension(app_state): Extension<Arc<AppState>>,
    Json(body): Json<LoginUserDto>,
) -> Result<impl IntoResponse, HttpError> {
    body.validate()
        .map_err(|e| HttpError::bad_request(e.to_string()))?;

    let result = app_state
        .db_client
        .get_user(None, None, Some(&body.email))
        .await
        .map_err(|e| HttpError::server_error(e.to_string()))?;

    let user = result.ok_or(HttpError::bad_request(
        ErrorMessage::WrongCredentials.to_string(),
    ))?;

    let password_matched = password::compare(&body.password, &user.password)
        .map_err(|e| HttpError::server_error(e.to_string()))?;

    if password_matched {
        let token = token::create_token(
            &user.id.to_string(),
            &app_state.env.jwt_secret.clone().into_bytes(),
            app_state.env.jwt_maxage,
        )
        .map_err(|e| HttpError::server_error(e.to_string()))?;

        let cookie_duration = time::Duration::minutes(app_state.env.jwt_maxage * 60);
        let cookie = cookie::Cookie::build(("token", token.clone()))
            .path("/")
            .max_age(cookie_duration)
            .http_only(true)
            .build();
        let response = Json(UserLoginResponseDto {
            status: "success".to_string(),
            token,
        });

        let mut headers = HeaderMap::new();
        headers.append(header::SET_COOKIE, cookie.to_string().parse().unwrap());

        let mut response = response.into_response();
        response.headers_mut().extend(headers);

        Ok(response)
    } else {
        Err(HttpError::bad_request(
            ErrorMessage::WrongCredentials.to_string(),
        ))
    }
}
