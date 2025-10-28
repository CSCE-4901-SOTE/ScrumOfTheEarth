# Install sqlx-cli

## Windows

-   Install cargo, which is installed as part of [rustup](https://rustup.rs/)
-   Install the sqlx cli through cargo here [sqlx-cli](https://github.com/launchbadge/sqlx/tree/main/sqlx-cli)

## WSL2 on Windows

-   sqlx-cli allows us to manage database migrations collectively
    -   It automatically keeps a record of which migrations have been run in a given database schema
    -   And makes it easy to apply any migrations that haven't been run before
-   Install dependencies for sqlx-cli
    -   `sudo apt install openssl libssl-dev pkg-config build-essential`
    -   needed to allow connecting via tls and build sqlx
-   Install the rust version manager
    -   `sudo apt install rustup`
    -   This allows us to install versions of rust and switch between them
-   Install the rust toolchain (the compiler, rustc and the build tool, cargo)
    -   `rustup default stable`
-   Install our migration tool, `sqlx-cli`
    -   `cargo install sqlx-cli`
-   Add this line to your path in `~/.bashrc` or `~/.zshrc`
    -   `export PATH=$PATH:"/home/$USER/.cargo/bin"`
    -   This makes the binary we just built available anywhere for new shells
-   Check the version of sqlx
    -   `which sqlx`
        -   should be `/home/$USER/.config/cargo/bin/sqlx`
    -   `sqlx --version` (> 0.8.2)
-   In the root directory of this repo
    -   run `sqlx migrate info` (ensure you've set the required env vars as described in [README.md](../README.md), to define to which database sqlx should
        compare) to list all the migrations.
    -   set up your database with `sqlx migrate run`