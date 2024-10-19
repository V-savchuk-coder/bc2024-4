const { program } = require('commander');
const http = require('http');
const fs = require('fs');

// Визначаємо обов'язкові параметри
program
    .option('-h, --host <host>', 'Address of server')
    .option('-p, --port <port>', 'Server port')
    .option('-c, --cache <directory>', 'Directory path to store cached data');

// Парсимо командні аргументи
program.parse(process.argv);

// Отримуємо параметри
const options = program.opts();

// Перевірка на наявність обов'язкових параметрів
if (!options.host || !options.port || !options.cache) {
    console.error('Error: Missing required options. Please provide host, port, and cache directory.');
    process.exit(1); // Вихід з процесу з кодом помилки
}

// Створюємо обробник запитів
const requestListener = function (req, res) {
    console.log(`Received request for ${req.url}`);
    res.writeHead(200); // Встановлюємо статус код 200
    res.end('My not first server');
};

// Створюємо та запускаємо сервер
const server = http.createServer(requestListener);
const host = options.host;
const port = options.port;

server.listen(port, host, () => {
    console.log(`Server is running on http://${host}:${port}`);
});
