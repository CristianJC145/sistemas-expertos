import express, { Request, Response } from 'express';
import bodyParser from 'body-parser';
import mysql from 'mysql';
import axios from 'axios';
import dotenv from 'dotenv';
import cors from 'cors'; 

dotenv.config();

const app = express();
const port = 3000;

app.use(cors({
    origin: 'http://localhost:3001',
}));

app.use(bodyParser.json());

// Configuración de la base de datos
const db = mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
});

db.connect((err) => {
    if (err) {
        console.error('Error connecting to the database:', err);
        return;
    }
    console.log('Connected to MySQL database.');
});

// Ruta para recomendaciones
app.post('/recommend', async (req: Request, res: Response) => {
    const { nombre, sintomas, antecedentes, edad, genero } = req.body;

    const palabrasClave = ['síntoma', 'dolor', 'enfermedad', 'tratamiento', 'medicamento', 'salud'];
    const inputTexto = [nombre, sintomas, antecedentes].join(' ').toLowerCase();
    const esValido = palabrasClave.some(palabra => inputTexto.includes(palabra));

    if (!esValido) {
        return res.status(400).json({ error: 'Por favor, proporcione información relacionada con síntomas o antecedentes médicos.' });
    }

    try {
        const response = await axios.post('https://api.openai.com/v1/chat/completions', {
            model: 'gpt-4o-mini',
            messages: [
                { role: 'system', content: 'Eres un sistema experto médico.' },
                { role: 'user', content: `Nombre: ${nombre}. Síntomas: ${sintomas}. Antecedentes médicos: ${antecedentes}. Edad: ${edad}. Género: ${genero}. ¿Cuáles son las recomendaciones de tratamiento según las guías médicas?` }
            ],
            max_tokens: 500
        }, {
            headers: {
                'Authorization': `Bearer ${process.env.API_KEY}`,
                'Content-Type': 'application/json'
            }
        });
        const recomendaciones = response.data.choices[0].message.content;

        // Dividir el texto en líneas y limpiar líneas vacías
        const lines = recomendaciones.split('\n').filter((line: string) => line.trim() !== '');

        // Capturar introducción y conclusión
        const introduccion = lines[0]; // Primera línea como introducción
        const conclusion = lines[lines.length - 1]; // Última línea como conclusión

        // Estructurar recomendaciones
        const recomendacionesHTML: string[] = []; // Para almacenar el HTML de las listas
        let currentList: string[] = []; // Lista actual de elementos principales

        // Recorrer cada línea para construir las listas y sublistas
        lines.forEach((line: string) => {
            const trimmedLine = line.trim();
            console.log('Procesando línea:', trimmedLine); // Log para ver cada línea

            // Detectar si es un elemento de lista principal
            if (/^\d+\.\s*\*\*.*\*\*/.test(trimmedLine)) {
                console.log('Detectado ítem principal:', trimmedLine); // Log para ítems principales

                // Si ya hay una lista en progreso, agregarla al HTML
                if (currentList.length > 0) {
                    recomendacionesHTML.push(`<ul>${currentList.join('')}</ul>`);
                    currentList = [];
                }

                // Formatear el elemento de la lista principal y agregarlo
                const item = trimmedLine.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
                currentList.push(`<li>${item}`);

            } 
            // Detectar si es un subítem
            else if (/^-\s.*$/.test(trimmedLine)) {
                console.log('Detectado subítem:', line); // Log para subítems

                const subItem = trimmedLine.replace(/^- /, '').trim();
                // Añadir el subítem correctamente dentro de la última lista principal
                if (currentList.length > 0) {
                    const lastItemIndex = currentList.length - 1;

                    // Añadir el subítem dentro de la sublista, crear si no existe
                    if (!currentList[lastItemIndex].includes('<ul>')) {
                        currentList[lastItemIndex] += `<ul><li>${subItem}</li></ul>`;
                    } else {
                        currentList[lastItemIndex] = currentList[lastItemIndex].replace(
                            /<\/ul>$/,
                            `<li>${subItem}</li></ul>`
                        );
                    }
                }
            } else {
                console.log('No es ítem ni subítem:', trimmedLine); // Log para líneas que no son listas

                // Cerrar el ítem principal correctamente si no hay más subítems
                if (currentList.length > 0 && !currentList[currentList.length - 1].endsWith('</li>')) {
                    currentList[currentList.length - 1] += '</li>';
                }
            }
        });

        // Cerrar el último ítem de la lista si está abierto
        if (currentList.length > 0 && !currentList[currentList.length - 1].endsWith('</li>')) {
            currentList[currentList.length - 1] += '</li>';
        }

        // Añadir la última lista si queda alguna pendiente
        if (currentList.length > 0) {
            recomendacionesHTML.push(`<ul>${currentList.join('')}</ul>`);
        }

        // Construir el HTML final con la introducción, listas y conclusión
        const resultHTML = `
            <h3>Recomendaciones para ${nombre}</h3>
            <p>${introduccion}</p>
            ${recomendacionesHTML.join('')}
            <p>${conclusion}</p>
        `;
        // Guardar datos en la base de datos
        const sql = 'INSERT INTO historia_clinica (nombre, sintomas, antecedentes, edad, genero, recomendaciones) VALUES (?, ?, ?, ?, ?, ?)';
        db.query(sql, [nombre, sintomas, antecedentes, edad, genero, recomendaciones], (err, result) => {
            if (err) {
                console.error('Error al guardar en la base de datos:', err);
                return res.status(500).json({ error: 'Error al guardar en la base de datos' });
            }
            console.log('Datos guardados en la base de datos:', result);
        });

        res.json({ recomendaciones: resultHTML });
    } catch (error) {
        console.error('Error al obtener recomendaciones:', error);
        res.status(500).json({ error: 'Error al procesar la solicitud' });
    }
});

app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
});
