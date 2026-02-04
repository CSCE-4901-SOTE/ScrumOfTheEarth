use std::io;
use std::collections::HashMap;
use gateway::ThreadPool;

use tokio::net::UdpSocket;

#[tokio::main]
async fn main() -> io::Result<()> {
    let mut guess = String::new();
    let client = reqwest::Client::new();
    let listener = UdpSocket::bind("127.0.0.1:8090").await?;   // Our socket to listen from the sensors
    let mut buf = [0; 1024];
    let pool = ThreadPool::new(4);

    loop {
        let (len, addr) = listener.recv_from(&mut buf).await?;
        // Call a thread to handle the connection
        pool.execute(|| {
            handle_connection();
        });
    }

    /*
    while guess != "q" {
        println!("Enter message to be sent to server");

        io::stdin()
        .read_line(&mut guess)
        .expect("Failed to read line");

        let mut map = HashMap::new();
        map.insert("content", &guess);
        
        let _res = client.post("http://192.168.4.24:8090/api/sensor")
            .json(&map)
            .send()
            .await
            .unwrap();

        println!("Got response")
    }
    */
}

// Handles some data from the sensor
fn handle_connection() {

}