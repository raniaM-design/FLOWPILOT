import { convertEditorContentToPlainText } from "./convert-editor-content";

describe("convertEditorContentToPlainText", () => {
  test("convertit les paragraphes en lignes séparées", () => {
    const html = "<p>Premier paragraphe</p><p>Deuxième paragraphe</p>";
    const result = convertEditorContentToPlainText(html);
    expect(result).toBe("Premier paragraphe\nDeuxième paragraphe");
  });

  test("préserve les titres de sections avec sauts de ligne", () => {
    const html = "<h1>Décisions</h1><p>Décision 1</p><h2>Actions</h2><p>Action 1</p>";
    const result = convertEditorContentToPlainText(html);
    expect(result).toContain("Décisions");
    expect(result).toContain("Actions");
    expect(result).toMatch(/\n\nDécisions\n\n/);
    expect(result).toMatch(/\n\nActions\n\n/);
  });

  test("convertit les listes en texte avec puces", () => {
    const html = "<ul><li>Item 1</li><li>Item 2</li></ul>";
    const result = convertEditorContentToPlainText(html);
    expect(result).toContain("- Item 1");
    expect(result).toContain("- Item 2");
  });

  test("gère les balises de formatage (gras, italique)", () => {
    const html = "<p>Texte <strong>gras</strong> et <em>italique</em></p>";
    const result = convertEditorContentToPlainText(html);
    expect(result).toBe("Texte gras et italique");
  });

  test("décode les entités HTML", () => {
    const html = "<p>Texte avec &eacute; et &amp;</p>";
    const result = convertEditorContentToPlainText(html);
    expect(result).toBe("Texte avec é et &");
  });

  test("gère le HTML vide ou invalide", () => {
    expect(convertEditorContentToPlainText("")).toBe("");
    expect(convertEditorContentToPlainText("<p></p>")).toBe("");
    expect(convertEditorContentToPlainText("texte sans balises")).toBe("texte sans balises");
  });

  test("préserve les mots importants comme Décisions, Actions, À venir", () => {
    const html = "<h1>Décisions</h1><p>Décision importante</p><h2>Actions</h2><p>Action à faire</p><h3>À venir</h3><p>Point futur</p>";
    const result = convertEditorContentToPlainText(html);
    expect(result).toContain("Décisions");
    expect(result).toContain("Actions");
    expect(result).toContain("À venir");
  });

  test("gère les retours à la ligne multiples", () => {
    const html = "<p>Paragraphe 1</p><p></p><p></p><p>Paragraphe 2</p>";
    const result = convertEditorContentToPlainText(html);
    // Les retours à la ligne multiples doivent être normalisés à max 2
    expect(result).not.toMatch(/\n{4,}/);
  });
});

