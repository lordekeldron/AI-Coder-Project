# Gerando e Executando o Aplicativo Desktop (Windows .exe)

O aplicativo é empacotado como um aplicativo desktop usando o **Electron**.

## Pré-requisitos

- **Windows 10 ou 11**
- **Node.js 18+ (LTS recomendado)** — baixe em https://nodejs.org

---

## Como rodar o aplicativo diretamente no seu computador

1. Abra a pasta do projeto no terminal (CMD ou PowerShell).
2. Instale as dependências:
   ```bat
   npm install
   ```
3. Compile a aplicação:
   ```bat
   npm run build
   ```
4. Inicie o aplicativo desktop:
   ```bat
   npm start
   ```
   *(ou `npm run electron:dev` para iniciar em modo de desenvolvimento)*

---

## Como gerar o instalador Windows (.exe)

Basta dar dois cliques no arquivo:
```bat
build-exe.bat
```
Ou rodar no terminal:
```bat
npm install
npm run dist:win
```

O instalador será gerado na pasta `release\`:
```
release\AIProgrammingAgent-Setup-1.0.0.exe
```

Ao executar o instalador, o atalho na Área de Trabalho e no Menu Iniciar será criado automaticamente.

---

## Banco de Dados e Conexão

O aplicativo possui um mecanismo de **armazenamento local integrado**.
Você **não** precisa configurar chaves do Supabase para o aplicativo abrir ou funcionar — o histórico de conversas, raciocínio do agente e mensagens são salvos localmente no seu computador.
Caso queira conectar um projeto Supabase próprio no futuro, basta preencher o arquivo `.env`.

---

## Solução de Problemas: Tela Escura / Vazia

Se a tela abrir preta ou vazia:
1. Certifique-se de executar `npm run build` antes de abrir o aplicativo standalone.
2. Pressione a tecla **F12** (ou `Ctrl + Shift + I`) dentro da janela do aplicativo para abrir as ferramentas de desenvolvedor (DevTools) e verificar se há alguma mensagem no console.
3. Se estiver usando o modo de desenvolvimento, certifique-se de que o comando `npm run dev` está em execução.
