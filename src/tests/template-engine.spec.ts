import { afterEach, beforeEach, describe, expect, mock, test } from "bun:test";
import { mkdir, rm, writeFile } from "node:fs/promises";
import { join, resolve } from "node:path";
import { TemplateEngine } from "../template-engine";

import type { Application } from "src/server";
import type { Options } from "../types/template-engine";

type TestEngineOptions = Omit<Partial<Options>, "path"> & {
  path?: Partial<Options["path"]>;
};

const TEST_DIR = resolve(process.cwd(), "test-temp");

beforeEach(async () => {
  await mkdir(TEST_DIR, { recursive: true });
  await mkdir(join(TEST_DIR, "views"), { recursive: true });
  await mkdir(join(TEST_DIR, "views/includes"), { recursive: true });
  await mkdir(join(TEST_DIR, "views/admin"), { recursive: true });
  await mkdir(join(TEST_DIR, "layouts"), { recursive: true });
  await mkdir(join(TEST_DIR, "partials"), { recursive: true });
});

afterEach(async () => {
  await rm(TEST_DIR, { recursive: true, force: true });
});

function createTestEngine(options: TestEngineOptions = {}) {
  const baseOptions: Options = {
    path: {
      views: join(TEST_DIR, "views"),
      layouts: join(TEST_DIR, "layouts"),
      partials: join(TEST_DIR, "partials"),
      ...options.path,
    },
    fileExtension: options.fileExtension ?? ".html",
    useModules: options.useModules ?? false,
    viewName: options.viewName ?? undefined,
  };

  return new TemplateEngine(baseOptions);
}

async function createTestFile(path: string, content: string) {
  await writeFile(resolve(TEST_DIR, path), content, "utf-8");
}

describe("TemplateEngine", () => {
  test("should initialize with default settings", () => {
    const engine = createTestEngine();
    expect(engine).toBeInstanceOf(TemplateEngine);
  });

  describe("Basic Rendering", () => {
    test("should interpolate variables", async () => {
      await createTestFile("views/index.html", "Hello {{ name }}!");
      const engine = createTestEngine();
      const result = await engine.render("index", { name: "World" });
      expect(result).toBe("Hello World!");
    });

    test("should escape HTML by default", async () => {
      await createTestFile("views/index.html", "{{ unsafe }}");
      const engine = createTestEngine();
      const result = await engine.render("index", { unsafe: "<script>" });
      expect(result).toBe("&lt;script&gt;");
    });

    test("should allow unescaped HTML", async () => {
      await createTestFile("views/index.html", "{{{ safe }}}");
      const engine = createTestEngine();
      const result = await engine.render("index", { safe: "<div>" });
      expect(result).toBe("<div>");
    });
  });

  describe("Layouts and Blocks", () => {
    beforeEach(async () => {
      await createTestFile(
        "layouts/base.html",
        `
        <html>{{= define block('content') }}</html>
      `,
      );
      await createTestFile(
        "views/page.html",
        `
        {{= layout('base') }}
        {{= block('content') }}Hello{{= endblock }}
      `,
      );
    });

    test("should apply layout correctly", async () => {
      const engine = createTestEngine();
      const result = await engine.render("page");
      expect(result).toMatch(/<html>Hello<\/html>/);
    });
  });

  describe("Partials and Includes", () => {
    test("should include partials", async () => {
      await createTestFile("partials/header.html", "<header>Partial</header>");
      await createTestFile("views/page.html", "{{= partial('header') }}");

      const engine = createTestEngine();
      const result = await engine.render("page");
      expect(result).toContain("<header>Partial</header>");
    });

    test("should process includes", async () => {
      await createTestFile("views/includes/footer.html", "<footer>Footer</footer>");
      await createTestFile("views/page.html", "{{= include('includes/footer') }}");

      const engine = createTestEngine();
      const result = await engine.render("page");
      expect(result).toContain("<footer>Footer</footer>");
    });
  });

  describe("Control Logic", () => {
    test("should process conditionals", async () => {
      await createTestFile(
        "views/conditional.html",
        `
        {{~ if (show) }}Yes{{~ else }}No{{~ endif }}
      `,
      );

      const engine = createTestEngine();
      const trueResult = await engine.render("conditional", { show: true });
      const falseResult = await engine.render("conditional", { show: false });
      expect(trueResult).toContain("Yes");
      expect(falseResult).toContain("No");
    });

    test("should process loops", async () => {
      await createTestFile(
        "views/loop.html",
        `
        {{~ for item in items }}<li>{{ item }}</li>{{~ endfor }}
      `,
      );

      const engine = createTestEngine();
      const result = await engine.render("loop", { items: ["A", "B"] });
      expect(result).toContain("<li>A</li><li>B</li>");
    });
  });

  describe("Plugins", () => {
    test("should execute registered plugins", async () => {
      await createTestFile("views/plugin.html", "{{ uppercase(name) }}");

      const engine = createTestEngine();
      engine.registerPlugin("uppercase", (str: string) => str.toUpperCase());
      const result = await engine.render("plugin", { name: "test" });
      expect(result).toBe("TEST");
    });
  });

  describe("Modules", () => {
    test("should resolve paths with modules", async () => {
      await createTestFile("views/admin/index.html", "Admin View");
      const engine = createTestEngine({
        path: {
          views: join(TEST_DIR, "views/**"),
        },
        useModules: true,
      }).module("admin");

      const result = await engine.render("index");
      expect(result).toBe("Admin View");
    });
  });

  describe("Error Handling", () => {
    test("should throw error for missing template", async () => {
      const engine = createTestEngine();
      await expect(engine.render("missing")).rejects.toThrow("No files found");
    });

    test("should throw error for missing layout", async () => {
      await createTestFile("views/page.html", "{{= layout('invalid') }}");
      const engine = createTestEngine();
      await expect(engine.render("page")).rejects.toThrow();
    });
  });

  describe("renderTemplate", () => {
    test("should render template with absolute path", async () => {
      await createTestFile("views/custom.html", "Custom Template");
      const engine = createTestEngine();
      const result = await engine.renderTemplate("test-temp/views/custom");
      expect(result).toBe("Custom Template");
    });
  });

  describe("configure", () => {
    test("should configure engine in application", () => {
      const engine = createTestEngine();
      const mockApp = {
        engine: {
          set: mock(),
        },
      };
      engine.configure(mockApp as unknown as Application);
      expect(mockApp.engine.set).toHaveBeenCalledWith(engine);
    });
  });

  describe("Security", () => {
    test("should escape HTML injection", async () => {
      await createTestFile("views/security.html", "{{ unsafe }}");
      const engine = createTestEngine();
      const maliciousInput = "<script>alert('xss')</script>";
      const result = await engine.render("security", { unsafe: maliciousInput });
      expect(result).not.toContain("<script>");
      expect(result).toContain("&lt;script&gt;");
    });
  });

  describe("Complex Expressions", () => {
    test("should handle nested expressions", async () => {
      await createTestFile("views/nested.html", "{{ a.b.c }}");
      const engine = createTestEngine();
      const data = { a: { b: { c: "Nested" } } };
      const result = await engine.render("nested", data);
      expect(result).toBe("Nested");
    });
  });
});
