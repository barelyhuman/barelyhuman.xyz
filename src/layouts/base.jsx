export default function BaseLayout({ children } = {}) {
  return (
    <html lang="en">
      <head>
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>barelyhuman.xyz</title>
      </head>
      <body>{children}</body>
    </html>
  );
}
