# Imagens do sistema

Coloque aqui os arquivos de imagem do sistema (brasão, foto de fundo, etc.).

Tudo o que está em `public/` é copiado para a raiz do site, tanto em
`npm run dev` quanto no `npm run build`. Um arquivo salvo como
`public/img/brasao-esao.png` fica acessível pelo caminho `/img/brasao-esao.png`.

## Como trocar as imagens

1. Salve o arquivo nesta pasta.
2. Abra `src/App.tsx` e edite a constante `IMAGENS` (logo no início do arquivo):

   ```ts
   const IMAGENS = {
     brasao: "/img/brasao-esao.png",
     fundoPortal: "/img/fundo-portal.jpg"
   };
   ```

3. Salve. Em desenvolvimento a tela recarrega sozinha.

Os valores que vêm por padrão são endereços temporários herdados do Google AI
Studio: podem sair do ar sem aviso e não carregam sem internet. Trocá-los por
arquivos locais é o caminho recomendado.

## Formatos recomendados

| Uso | Formato | Tamanho |
|---|---|---|
| Brasão / logo | PNG com fundo transparente | 512×512 px, até ~100 KB |
| Foto de fundo | JPG ou WebP | 1920 px de largura, até ~300 KB |
| Favicon | PNG ou SVG | 64×64 px |

Se o brasão for um PNG com fundo transparente, remova a classe
`mix-blend-multiply` do `<img>` da tela de login em `src/App.tsx`: ela existe
para apagar o fundo branco de imagens sem transparência e atrapalha quando a
imagem já é transparente.

## Favicon

Salve o arquivo aqui (por exemplo `favicon.png`) e acrescente no `<head>` do
`index.html`:

```html
<link rel="icon" type="image/png" href="/img/favicon.png" />
```
