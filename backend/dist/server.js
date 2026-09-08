import express from 'express';
const app = express();
const port = Number(process.env.PORT ?? 4000);
app.use(express.json());
app.get('/health', (_request, response) => {
    response.status(200).json({
        success: true,
        data: { status: 'ok' },
        message: 'Backend is healthy',
    });
});
app.listen(port, () => {
    console.log(`Backend listening on port ${port}`);
});
