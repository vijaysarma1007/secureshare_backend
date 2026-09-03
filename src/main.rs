mod config;
mod db;
mod dtos;
mod error;
mod models;

use axum::{
    Router,
    http::{
        HeaderValue, Method,
        header::{ACCEPT, AUTHORIZATION, CONTENT_TYPE},
    },
};
use config::Config;
use db::DBClient;
use dotenvy::dotenv;
use sqlx::postgres::PgPoolOptions;
use tokio_cron_scheduler::{Job, JobScheduler};
use tower_http::cors::CorsLayer;
use tracing_subscriber::filter::LevelFilter;

use crate::db::UserExt;

#[derive(Debug, Clone)]
pub struct AppState {
    pub env: Config,
    pub db_client: DBClient,
}

#[tokio::main]
async fn main() {
    // tracing_subcriber ->  When your Axum backend runs, things happen: a user signs up, a database query runs, or an error occurs. To know what’s going on inside your app while it is running, you need a way to print out these messages.
    // helps to track events and errors at runtime
    tracing_subscriber::fmt()
        .with_max_level(LevelFilter::DEBUG)
        .init();

    dotenv().ok();
    let config = Config::init();

    // connect with postgres databse set to maximum 10 database connections
    let pool = match PgPoolOptions::new()
        .max_connections(10)
        .connect(&config.database_url)
        .await
    {
        Ok(pool) => {
            println!("Connection to the database is successful!");
            pool
        }
        Err(error) => {
            println!("Failed to connect to the database: {:?}", error);
            std::process::exit(1);
        }
    };

    // cross origin resousce sharing: allows connetion of api with the frontend app 
    let cors = CorsLayer::new()
        .allow_origin("http://localhost:3000".parse::<HeaderValue>().unwrap())
        .allow_headers([AUTHORIZATION, ACCEPT, CONTENT_TYPE])
        .allow_credentials(true)
        .allow_methods([Method::GET, Method::POST, Method::PUT]);

    let db_client = DBClient::new(pool);

    let app_state = AppState {
        env: config.clone(),
        db_client: db_client.clone(),
    };

    //allows to run the scheduled task in the background
    let sched = JobScheduler::new().await.unwrap();

    // runs the function every hour
    let job = Job::new_async("0 0 * * * *", {
        move |_, _| {
            let db_client = db_client.clone();
            Box::pin(async move {
                println!("Running scheduled task to delete expired files...");
                if let Err(err) = db_client.delete_expired_files().await {
                    eprintln!("Error deleteing expired files: {:?}", err);
                } else {
                    println!("Successfullydeleted expired files.");
                }
            })
        }
    })
    .unwrap();

    sched.add(job).await.unwrap();

    // we spawn a thread to run the synchronization in the background
    tokio::spawn(async move {
        sched.start().await.unwrap();
    });

    let app: Router = Router::new().layer(cors);
    println!(
        "{}",
        format!("Server is running on http::localhost:{}", &config.port)
    );


    //Router
    let listener = tokio::net::TcpListener::bind(format!("0.0.0.0:{}", &config.port))
        .await
        .unwrap();
    axum::serve(listener, app).await.unwrap();
}
