# Sanity Plugin - Raster

A Sanity Studio plugin that integrates [Raster](https://raster.app) - a modern Digital Asset Management (DAM) platform that helps teams organize, optimize, and deliver their media assets with powerful AI features and an intuitive interface.

## Features

- 🖼️ Seamless integration with Raster DAM in Sanity Studio
- 🔄 Direct asset selection from your Raster libraries
- 🎯 Custom image field type (`raster.image`) for better type safety
- 🎨 Modern UI that matches Sanity's design system
- 📱 Responsive image preview and selection

## Installation

```bash
npm install @monogram/sanity-plugin-raster
# or
yarn add @monogram/sanity-plugin-raster
# or
pnpm add @monogram/sanity-plugin-raster
```

## Configuration

### 1. Get Your Raster Credentials

1. Sign up for a Raster account at [raster.app](https://raster.app)
2. Get your API key from your Raster dashboard
3. Note your organization ID

### 2. Add the Plugin to Your Sanity Config

```typescript
// sanity.config.ts
import { defineConfig } from "sanity";
import { rasterPlugin } from "@monogram/sanity-plugin-raster";

export default defineConfig({
  // ...other config
  plugins: [
    // ...other plugins
    rasterPlugin({
      apiKey: "your-raster-api-key",
      orgId: "your-organization-id",
    }),
  ],
});
```

## Usage

### Basic Schema Example

```typescript
// schemas/blogPost.ts
import { defineType } from "sanity";

export default defineType({
  name: "blogPost",
  title: "Blog Post",
  type: "document",
  fields: [
    {
      name: "title",
      title: "Title",
      type: "string",
      validation: (Rule) => Rule.required(),
    },
    {
      name: "description",
      title: "Description",
      type: "text",
      rows: 3,
    },
    {
      name: "featuredImage",
      title: "Featured Image",
      type: "image",
      description: "Select an image from Raster",
    },
  ],
});
```

### Using the Image in Your Frontend

The image field will store the URL and alt text. Here's how the data structure looks:

```typescript
interface RasterImage {
  _type: "image";
  asset: {
    url: string;
  };
  alt?: string;
}
```

Example usage in Next.js:

```tsx
import Image from "next/image";

function BlogPost({ post }) {
  return (
    <article>
      <h1>{post.title}</h1>
      {post.featuredImage && (
        <Image
          src={post.featuredImage.asset.url}
          alt={post.featuredImage.alt || ""}
          width={1200}
          height={630}
        />
      )}
      <p>{post.description}</p>
    </article>
  );
}
```

## Development

1. Clone this repository
2. Install dependencies with `pnpm install`
3. Run `pnpm build` to build the plugin
4. Link the plugin to your Sanity studio for testing:

   ```bash
   # In the plugin directory
   pnpm link-watch

   # In your Sanity studio directory
   pnpm yalc add @monogram/sanity-plugin-raster
   pnpm install
   ```

## Contributing

Contributions are welcome! Please read our [contributing guidelines](CONTRIBUTING.md) to get started.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

MIT © Monogram Inc.

## About Raster

[Raster](https://raster.app) is a modern Digital Asset Management (DAM) platform that helps teams organize, optimize, and deliver their media assets. With features like AI-powered search, automatic tagging, and advanced image optimization, Raster makes it easy to manage your digital assets at scale.

Key features:

- AI-powered asset organization
- Advanced image optimization
- Intuitive asset management
- Powerful API and integrations
- Team collaboration tools

## Support

- 📝 [Documentation](https://docs.raster.app)
- 📧 [Email Support](mailto:support@raster.app)

---

<div align="center">
Made with ❤️ by <a href="https://monogram.io">Monogram</a>
</div>
