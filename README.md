<h2>Sobre o projeto</h2>
<p>O projeto é uma API REST que gerencia o ciclo de vida de cobranças de um sistema financeiro, com integração específica para processamento de pagamentos via PIX e Cartão de Crédito.</p>

<h2>As Tecnologias utilizadas</h2>
<ul>
  <li><a href="https://nodejs.org/">Node.js v22.18.0</a></li>
  <li><a href="https://nestjs.com/">NestJS</a></li>
  <li><a href="https://temporal.io/">Temporal.io</a></li>
  <li><a href="https://www.postgresql.org/">PostgreSQL</a></li>
  <li><a href="https://knexjs.org/">Knex.js</a></li>
  <li><a href="https://swagger.io/">Swagger UI</a></li>
  <li><a href="https://jestjs.io/">Jest</a></li>
  <li><a href="https://ngrok.com/">Ngrok</a></li>
  <li>Docker & Docker Compose</li>
</ul>

<h2>Funcionalidades</h2>
<h3>Backend (Payment Service)</h3>
<ul>
  <li>Criação de intenções de pagamento</li>
  <li>Integração nativa com Mercado Pago</li>
  <li>Orquestração de status (Pendente, Pago, Falha) com Temporal</li>
  <li>Recebimento de notificações via Webhooks</li>
  <li>Atualização manual de status via API</li>
  <li>Retentativas automáticas em caso de falhas de rede</li>
</ul>

<h3>Monitoramento e Testes</h3>
<ul>
  <li>Dashboard de Workflows</li>
  <li>Documentação interativa com Swagger</li>
</ul>

<h2>Como executar o projeto</h2>
<ol>
  <li>Abra o terminal na raiz do projeto e suba a infraestrutura de banco de dados e o cluster do Temporal com o comando: <b>docker-compose up -d</b>. Você verá algo assim:
    <p align="center"></p>
  </li>
  <li>Abra a pasta do projeto e execute os comandos: <b>npm install</b> e <b>npm run start:dev</b>. Após rodar as migrations com <b>npm run migration:run</b>, você verá que o servidor subiu:    
    <p align="center"></p>
  </li>
  <li>Agora abra um novo terminal e execute o worker para processar os workflows: <b>npm run worker:temporal</b>. Em seu browser, você poderá monitorar os pagamentos e testar a API:
      <p align="center"></p>
  </li>
</ol>
