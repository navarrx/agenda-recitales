# Agenda App

Una aplicación web moderna para la gestión de contactos y eventos, desarrollada con React en el frontend y Python/FastAPI en el backend.

## 🚀 Características

- Gestión completa de contactos
- Calendario de eventos
- Interfaz de usuario moderna y responsive
- API RESTful
- Autenticación de usuarios
- Base de datos PostgreSQL

## 🛠️ Tecnologías Utilizadas

### Frontend
- React
- TypeScript
- TailwindCSS
- React Router
- Axios

### Backend
- Python
- FastAPI
- SQLAlchemy
- PostgreSQL
- Alembic (migraciones)

## 📋 Prerrequisitos

- Python 3.8+
- Node.js 16+
- PostgreSQL 13+
- npm o yarn

## 🔧 Instalación

### Backend

1. Crear y activar el entorno virtual:
```bash
python -m venv venv
source venv/bin/activate  # En Windows: venv\Scripts\activate
```

2. Instalar dependencias:
```bash
cd backend
pip install -r requirements.txt
```

3. Configurar variables de entorno:
```bash
cp .env.example .env
# Editar .env con tus configuraciones
```

4. Ejecutar migraciones:
```bash
alembic upgrade head
```

5. Iniciar el servidor:
```bash
uvicorn app.main:app --reload
```

### Frontend

1. Instalar dependencias:
```bash
cd frontend
npm install
```

2. Configurar variables de entorno:
```bash
cp .env.example .env
# Editar .env con tus configuraciones
```

3. Iniciar el servidor de desarrollo:
```bash
npm run dev
```

## 🚀 Despliegue

Este proyecto está configurado para ser desplegado en Railway. Para desplegar:

1. Crear una cuenta en Railway
2. Conectar el repositorio de GitHub
3. Configurar las variables de entorno necesarias
4. Railway se encargará automáticamente del despliegue

## 📝 Licencia

Este proyecto está bajo la Licencia MIT - ver el archivo [LICENSE](LICENSE) para más detalles.

## 👥 Contribuir

Las contribuciones son bienvenidas. Por favor, lee [CONTRIBUTING.md](CONTRIBUTING.md) para detalles sobre nuestro código de conducta y el proceso para enviarnos pull requests.

## ✨ Agradecimientos

- A todos los contribuidores que participan en este proyecto
- A la comunidad de código abierto por las herramientas utilizadas 