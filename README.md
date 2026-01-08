<h2>Sobre o projeto</h2>
<p>O projeto é uma API REST que gerencia o ciclo de vida de cobranças de um sistema financeiro, com integração específica para processamento de pagamentos via PIX e Cartão de Crédito, utilizando workflows resilientes do Temporal.io para garantir a consistência das transações.</p>

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
<ul>
  <li>Criação de intenções de pagamento</li>
  <li>Integração nativa com Mercado Pago</li>
  <li>Orquestração de status (Pendente, Pago, Falha) com Temporal</li>
  <li>Recebimento de notificações via Webhooks</li>
  <li>Atualização manual de status via API</li>
</ul>

<h2>Como executar o projeto</h2>
<p>Siga os passos abaixo para configurar o ambiente em sua máquina local:</p>

<ol>
  <li>
    <b>Clonagem do Repositório:</b>
    <br>Abra o terminal e clone o projeto:
    <pre><code>git clone https://github.com/LuandaRezende/payments_service.git
cd payments-service</code></pre>
  </li>

  <li>
    <b>Configuração das Variáveis de Ambiente:</b>
    <br>Crie um arquivo <b>.env</b> na raiz do projeto. O campo <code>WEBHOOK_URL</code> deve ser atualizado após iniciar o Ngrok:
    <pre><code>DATABASE_URL=postgres://user:pass@localhost:5432/payments_service_db
PASSWORD=pass
DB_NAME=payments_service_db
DB_USER=user
DB_PORT=5432
DB_HOST=localhost
TOKEN_MERCADO_PAGO=APP_USR-4183516322848106-123019-d4a173bb50d2fa80389c0487f6a5227b-3102973327
NODE_ENV=development
TEMPORAL_ADDRESS=localhost:7233
WEBHOOK_URL=https://semirebelliously-burnoused-esperanza.ngrok-free.dev/api/payment/webhook</code></pre>
  </li>

  <li>
    <b>Subir Infraestrutura (Docker):</b>
    <br>Execute o comando abaixo para subir o PostgreSQL e o Temporal:
    <pre><code>docker-compose up -d</code></pre>
    <p align="center"><img src="./assets/docker.png" alt="Docker Compose"></p>
  </li>

  <li>
    <b>Exposição da Porta (Ngrok):</b>
    <br>Em um terminal separado, execute para gerar sua URL pública:
    <pre><code>npx ngrok http 3000</code></pre>
    <p><i>Copie a URL gerada e atualize o <b>WEBHOOK_URL</b> no seu .env.</i></p>
  </li>

  <li>
    <b>Instalação e Banco de Dados:</b>
    <br>Instale as dependências e rode as migrations (certifique-se de ter criado o DB no PgAdmin):
    <pre><code>npm install
npm run migration:run</code></pre>
  </li>

  <li>
    <b>Iniciar a API e o Worker:</b>
    <br>Terminal 1 (API): <code>npm run start:dev</code>
    <br>Terminal 2 (Worker): <code>npm run worker:temporal</code>
  </li>
</ol>

<h2>Garantia de Qualidade (Testes Automatizados)</h2>
<p>O projeto conta com uma suíte de testes robusta para garantir a confiabilidade de cada transação.</p>

<h3>1. Testes Unitários</h3>
<p>Focados na lógica de negócio e regras da <b>Clean Architecture</b>. Garantem que os Use Cases e Entidades funcionem de forma isolada.</p>
<pre><code>npm run test:unit</code></pre>

<h3>2. Testes de Integração (E2E)</h3>
<p>Validam o fluxo completo desde a requisição HTTP até a persistência no banco de dados e comunicação com o Temporal.</p>
<pre><code>npm run test:e2e</code></pre>

<h3>3. Cobertura de Código</h3>
<p>Para gerar um relatório detalhado de cobertura e garantir que todos os cenários críticos foram testados:</p>
<pre><code>npm run test:cov</code></pre>

<h2> Guia de Teste de Pagamento</h2>
<p>Para testar o fluxo sem erros de permissão, siga exatamente esta ordem:</p>

<ol>
  <li>
    <b>Gerar o Link de Checkout:</b>
    <br>Faça um <b>POST</b> em <code>http://localhost:3000/api/payment</code> via Swagger ou Postman.
    <br>Guarde a <code>checkoutUrl</code> retornada.
  </li>

  <li>
    <b>Login na Conta de Teste (Sandbox):</b>
    <br>Abra uma <b>guia anônima</b> e acesse: <a href="https://www.mercadopago.com.br/developers/pt">Mercado Pago Developers</a>.
    <br>Clique em "Entrar" e utilize as credenciais do <b>comprador de teste</b>:
    <ul>
      <li><b>E-mail:</b> <code>TESTUSER6147476937484009250</code></li>
      <li><b>Senha:</b> <code>KzDwEzMYnN</code></li>
    </ul>
  </li>

  <li>
    <b>Realizar o Pagamento:</b>
    <br>Na <b>mesma guia anônima</b> onde você acabou de logar, cole o link da <code>checkoutUrl</code> gerada no passo 1.
    <br>Selecione o método de pagamento e finalize a compra.
  </li>

  <li>
    <b>Verificar Resultados:</b>
    <br>Confira os logs do <b>Ngrok</b> (recebimento do POST) e o dashboard do <b>Temporal UI</b> (Workflow concluído).
  </li>
</ol>
