mod sqlite;
pub fn test() {
    sqlite::init_config().unwrap()
}
