export default function robots() {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/tool-editor/", "/login", "/register"],
      },
    ],
    sitemap: "https://www.dqx-tool.com/sitemap.xml",
  };
}
