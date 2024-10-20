const path = require('path');
const { program } = require('commander');
const fs = require('fs').promises;
const http = require('http');

// Налаштування параметрів командного рядка
program
  .option('-h, --host <host>', 'Адреса сервера')
  .option('-p, --port <port>', 'Порт сервера')
  .option('-c, --cache <cache>', 'Директорія для кешування');

const options = program.opts(); // Зберігаємо options тут

program.parse(process.argv);

// Перевірка параметрів
if (!options.host || !options.port || !options.cache) {
  console.error('Invalid options. Please provide host, port, and cache directory.');
  process.exit(1);
}


const { host, port, cache } = options; // Отримання параметрів

// Створення сервера
const server = http.createServer(async (req, res) => {
  const urlParts = req.url.split('/');
  const statusCode = urlParts[1]; // отримуємо код HTTP
  const filePath = path.join(cache, `${statusCode}.jpg`);

  try {
    switch (req.method) {
      case 'GET':
        // Отримати картинку з кешу
        await fs.access(filePath);
        const imageData = await fs.readFile(filePath);
        res.writeHead(200, { 'Content-Type': 'image/jpeg' });
        res.end(imageData);
        break;

      case 'PUT':
        // Записати або замінити картинку в кеші
        const data = [];
        req.on('data', chunk => data.push(chunk));
        req.on('end', async () => {
          await fs.writeFile(filePath, Buffer.concat(data));
          res.writeHead(201, { 'Content-Type': 'text/plain' });
          res.end('Image saved successfully!');
        });
        break;

      case 'DELETE':
        // Видалити картинку з кешу
        await fs.unlink(filePath);
        res.writeHead(200, { 'Content-Type': 'text/plain' });
        res.end('Image deleted successfully!');
        break;

      default:
        // Метод не дозволено
        res.writeHead(405, { 'Content-Type': 'text/plain' });
        res.end('Method Not Allowed');
        break;
    }
  } catch (error) {
    if (error.code === 'ENOENT') {
      // Картинку не знайдено
      res.writeHead(404, { 'Content-Type': 'text/plain' });
      res.end('Not Found');
    } else {
      // Інші помилки
      res.writeHead(500, { 'Content-Type': 'text/plain' });
      res.end('Internal Server Error');
    }
  }
});

// Запуск сервера
server.listen(port, host, () => {
  console.log(`Сервер запущено: http://${host}:${port}`);
});


