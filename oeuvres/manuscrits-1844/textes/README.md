# Textes — Manuscrits de 1844

Fichiers locaux charges par la liseuse de `../manuscrits-1844.html`.

Le texte a ete importe depuis l'archive XML/TEI du Marxists Internet Archive :

- source HTML : `https://www.marxists.org/francais/marx/works/1844/00/km18440000/index.htm`
- archive XML : `https://www.marxists.org/francais/marx/works/1844/00/km18440000/km18440000_xml.zip`

Avant de modifier ces fichiers :

- conserver le decoupage de `../manifest.json` ;
- verifier que la liseuse charge toujours les cinq parties ;
- garder les liens source pour pouvoir comparer avec l'archive distante.

Fichiers attendus par la liseuse :

- `note-traducteur.html`
- `preface.html`
- `premier-manuscrit.html`
- `second-manuscrit.html`
- `troisieme-manuscrit.html`

Format utilise :

```html
<article data-reader-text>
  <h1>Titre de la partie</h1>
  <p>Texte...</p>
</article>
```
