use crate::error::ErrorMessage;
use argon2::{
    Argon2, PasswordHash, PasswordHasher, PasswordVerifier, password_hash::phc::SaltString,
};

const MAX_PASSWORD_LENGTH: usize = 64;

pub fn hash(password: impl Into<String>) -> Result<String, ErrorMessage> {
    let password = password.into();

    if password.is_empty() {
        return Err(ErrorMessage::EmptyPassword);
    }

    if password.len() > MAX_PASSWORD_LENGTH {
        return Err(ErrorMessage::ExceededMaxPasswordLength(MAX_PASSWORD_LENGTH));
    }

    let salt = SaltString::generate();
    let hash_password = Argon2::default()
        .hash_password_with_salt(&password.as_bytes(), &salt.as_bytes())
        .map_err(|_| ErrorMessage::HashingError)?
        .to_string();

    Ok(hash_password)
}

pub fn compare(password: &str, hashed_password: &str) -> Result<bool, ErrorMessage> {
    if password.is_empty() {
        return Err(ErrorMessage::EmptyPassword);
    }

    if password.len() > MAX_PASSWORD_LENGTH {
        return Err(ErrorMessage::ExceededMaxPasswordLength(MAX_PASSWORD_LENGTH));
    }

    let parsed_hash =
        PasswordHash::new(hashed_password).map_err(|_| ErrorMessage::InvalidHashFormat)?;

    let password_matched = Argon2::default()
        .verify_password(password.as_bytes(), &parsed_hash)
        .map_or(false, |_| true);
    Ok(password_matched)
}
