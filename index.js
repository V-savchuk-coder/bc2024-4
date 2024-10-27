const path = require('path');
const { program } = require('commander');
const fs = require('fs').promises;
const http = require('http');
const superagent = require('superagent'); // Додано

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

// Створюємо сервер
const server = http.createServer(async (req, res) => {
    const urlParts = req.url.split('/');
    const httpCode = urlParts[1];
    const imagePath = path.join(options.cache, `${httpCode}.jpg`);

    switch (req.method) {
        case 'GET':
            try {
                // Перший запит: намагаємося прочитати зображення з кешу
                const image = await fs.readFile(imagePath);
                res.writeHead(200, { 'Content-Type': 'image/jpeg' });
                res.statusCode = 200;
                res.end(image);
            } catch (error) {
                try {
                    // Якщо файл не знайдено у кеші, робимо запит на http.cat
                    const response = await superagent.get(`https://http.cat/${httpCode}`).responseType('blob');
                    const image = response.body;
                    
                    // Зберігаємо отримане зображення у кеш
                    await fs.writeFile(imagePath, image);
                    
                    res.writeHead(200, { 'Content-Type': 'image/jpeg' });
                    res.end(image);
                } catch (err) {
                    // Якщо зображення не знайдено і на http.cat, повертаємо 404
                    res.writeHead(404, { 'Content-Type': 'text/plain' });
                    res.end('Image not found 404');
                }
            }
            break;

        case 'PUT':
            try {
                const data = await new Promise((resolve, reject) => {
                    const chunks = [];
                    req.on('data', chunk => chunks.push(chunk));
                    req.on('end', () => resolve(Buffer.concat(chunks)));
                    req.on('error', reject);
                });

                if (data.length > 0) {
                    await fs.writeFile(imagePath, data);
                    res.writeHead(201, { 'Content-Type': 'text/plain' });
                    res.end('Image saved');
                } else {
                    const response = await superagent.get(`https://http.cat/${httpCode}`);
                    const image = response.body;

                    await fs.writeFile(imagePath, image);
                    res.writeHead(201, { 'Content-Type': 'image/jpeg' });
                    res.end(image);
                }
            } catch (error) {
                console.error('Error saving image:', error);
                res.writeHead(500, { 'Content-Type': 'text/plain' });
                res.end('Error saving image');
            }
            break;

        case 'DELETE':
            try {
                await fs.unlink(imagePath);
                res.writeHead(200, { 'Content-Type': 'text/plain' });
                res.end('Image deleted');
            } catch (error) {
                res.writeHead(404, { 'Content-Type': 'text/plain' });
                res.end('Image not found');
            }
            break;

        default:
            res.writeHead(405, { 'Content-Type': 'text/plain' });
            res.end('Method not allowed');
            break;
    }
});

// Запускаємо сервер
server.listen(options.port, options.host, () => {
    console.log(`Server running at http://${options.host}:${options.port}/`);
});
