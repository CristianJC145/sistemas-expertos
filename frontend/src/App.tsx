import React, { useState, FormEvent } from 'react';
import Spinner from './components/spinner';
import axios from 'axios';
import {
  Container,
  TextField,
  Button,
  Typography,
  Paper,
  Box,
  Snackbar,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from '@mui/material';
import MuiAlert, { AlertProps } from '@mui/material/Alert';

const Alert = React.forwardRef<HTMLDivElement, AlertProps>(function Alert(
  props,
  ref
) {
  return <MuiAlert elevation={6} ref={ref} variant="filled" {...props} />;
});

const App: React.FC = () => {
  const [nombre, setNombre] = useState<string>('');
  const [sintomas, setSintomas] = useState<string>('');
  const [antecedentes, setAntecedentes] = useState<string>('');
  const [edad, setEdad] = useState<number | ''>('');
  const [genero, setGenero] = useState<string>('');
  const [recomendaciones, setRecomendaciones] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true); 
    try {
      const response = await axios.post('http://localhost:3000/recommend', {
        nombre,
        sintomas,
        antecedentes,
        edad,
        genero,
      });
      setRecomendaciones(response.data.recomendaciones);
      setSnackbarMessage('Recomendaciones obtenidas con éxito.');
      setSnackbarOpen(true);
    } catch (error) {
      if (axios.isAxiosError(error)) {
        alert(error.response?.data?.error || 'Ocurrió un error desconocido.');
      } else {
        console.error('Error:', error);
        alert('Ocurrió un error al procesar la solicitud.');
      }
      setRecomendaciones('');
      setSnackbarMessage('Error al obtener recomendaciones. Inténtalo nuevamente.');
      setSnackbarOpen(true);
    } finally {
      setLoading(false);
    }
  };

  const handleSnackbarClose = (
    event?: React.SyntheticEvent | Event,
    reason?: string
  ) => {
    if (reason === 'clickaway') {
      return;
    }
    setSnackbarOpen(false);
  };
  return (
    <Container maxWidth="sm">
      {loading && <Spinner /> }
      <Paper elevation={3} style={{ padding: '20px', marginTop: '20px' }}>
        <Typography variant="h4" align="center" gutterBottom>
          Recomendación Médica
        </Typography>
        <form onSubmit={handleSubmit}>
          <TextField
            fullWidth
            label="Nombre"
            variant="outlined"
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
            margin="normal"
            required
          />
          <TextField
            fullWidth
            label="Síntomas"
            variant="outlined"
            value={sintomas}
            onChange={(e) => setSintomas(e.target.value)}
            margin="normal"
            required
          />
          <TextField
            fullWidth
            label="Antecedentes Médicos"
            variant="outlined"
            value={antecedentes}
            onChange={(e) => setAntecedentes(e.target.value)}
            margin="normal"
            required
          />
          <TextField
            fullWidth
            label="Edad"
            variant="outlined"
            type="number"
            value={edad}
            onChange={(e) => setEdad(Number(e.target.value))}
            margin="normal"
            required
          />
          <FormControl fullWidth margin="normal" required>
            <InputLabel>Género</InputLabel>
            <Select
              value={genero}
              onChange={(e) => setGenero(e.target.value)}
              label="Género"
            >
              <MenuItem value="masculino">Masculino</MenuItem>
              <MenuItem value="femenino">Femenino</MenuItem>
              <MenuItem value="otro">Otro</MenuItem>
            </Select>
          </FormControl>
          <Button
            type="submit"
            variant="contained"
            color="primary"
            fullWidth
            style={{ marginTop: '20px' }}
            disabled={loading}
          >
            Enviar
          </Button>
        </form>
        {recomendaciones && (
          <Box mt={3}>
            <div dangerouslySetInnerHTML={{ __html: recomendaciones }} />
          </Box>
        )}
      </Paper>
      <Snackbar
        open={snackbarOpen}
        autoHideDuration={6000}
        onClose={handleSnackbarClose}
      >
        <Alert onClose={handleSnackbarClose} severity="success">
          {snackbarMessage}
        </Alert>
      </Snackbar>
    </Container>
  );
};

export default App;
