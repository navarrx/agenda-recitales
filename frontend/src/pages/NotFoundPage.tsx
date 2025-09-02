import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import Layout from '../components/layout/Layout';

const NotFoundPage = () => {
  return (
    <Layout>
      <div className="min-h-[70vh] flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center max-w-2xl mx-auto px-4"
        >
          {/* Número 404 con animación */}
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="mb-8"
          >
            <h1 className="text-8xl md:text-9xl font-bold bg-gradient-to-r from-primary-400 to-primary-600 bg-clip-text text-transparent">
              404
            </h1>
          </motion.div>

          {/* Título principal */}
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="text-3xl md:text-4xl font-bold text-white mb-4"
          >
            ¡Oops! Página no encontrada
          </motion.h2>

          {/* Descripción */}
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.6 }}
            className="text-lg text-gray-300 mb-8 leading-relaxed"
          >
            La página que buscas no existe o ha sido movida. 
            No te preocupes, puedes volver al inicio y explorar nuestros eventos.
          </motion.p>



          {/* Botones de acción */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.8 }}
            className="flex flex-col sm:flex-row gap-4 justify-center items-center"
          >
            <Link
              to="/"
              className="group relative px-8 py-3 bg-gradient-to-r from-primary-500 to-primary-600 text-white font-semibold rounded-lg shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 hover:-translate-y-1"
            >
              <span className="relative z-10">Volver al Inicio</span>
              <motion.div
                className="absolute inset-0 bg-gradient-to-r from-primary-600 to-primary-700 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                initial={false}
              />
            </Link>

            <Link
              to="/events"
              className="group relative px-8 py-3 border-2 border-primary-500 text-primary-400 font-semibold rounded-lg hover:bg-primary-500 hover:text-white transition-all duration-300 transform hover:scale-105 hover:-translate-y-1"
            >
              Ver Eventos
            </Link>
          </motion.div>

          {/* Línea decorativa */}
          <motion.div
            initial={{ scaleX: 0 }}
            animate={{ scaleX: 1 }}
            transition={{ duration: 1, delay: 1 }}
            className="mt-12 h-px bg-gradient-to-r from-transparent via-primary-500 to-transparent"
          />
        </motion.div>
      </div>
    </Layout>
  );
};

export default NotFoundPage; 