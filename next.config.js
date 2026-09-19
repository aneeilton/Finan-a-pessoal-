/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  experimental: {
    // As telas dependem de dados do usuario que mudam a cada acao (saldo,
    // conta padrao, lancamentos); sem isso o Next reaproveita paginas
    // dinamicas ja pre-carregadas (ex: pelo prefetch do menu inferior)
    // por ate 30s, mostrando valores desatualizados apos navegar.
    staleTimes: {
      dynamic: 0,
    },
  },
};

module.exports = nextConfig;
