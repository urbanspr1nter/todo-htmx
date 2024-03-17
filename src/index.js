import fastifyFormBody from "@fastify/formbody";
import fastifyStatic from "@fastify/static";
import fastifyView from "@fastify/view";
import ejs from "ejs";
import Fastify from "fastify";
import fs from "fs";
import path from "node:path";
import { v4 as uuid } from "uuid";

const PORT = process.env.PORT || 6777;
const dirname = import.meta.dirname;

const fastify = Fastify({ logger: true });
fastify.register(fastifyStatic, {
    root: path.join(dirname, "static"),
});
fastify.register(fastifyFormBody);
fastify.register(fastifyView, {
    engine: {
        ejs,
    },
});

fastify.get("/", (_req, res) => {
    return res.view(`src/templates/index.ejs`);
});

fastify.get("/list", (_req, res) => {
    const db = getDb();
    return res.view(`src/templates/todos.ejs`, { todos: db });
});

fastify.post("/todo", (req, res) => {
    const id = uuid();
    const title = req.body.title ?? "";
    const done = false;

    const entry = { id, title, done };
    const db = getDb();
    const newDb = [...db, entry];

    fs.writeFileSync(
        `${dirname}/../db.json`,
        JSON.stringify(newDb, undefined, 2),
    );

    return res.view(`src/templates/todos.ejs`, { todos: newDb });
});

fastify.put("/todo", (req, res) => {
    const done = !!req.body["todo-done"];
    const id = req.body.id;

    if (!id) {
        return res.view(`src/templates/error.ejs`);
    }

    const db = getDb();
    const idx = db.findIndex((entry) => entry.id === id);
    if (idx === -1) {
        return res.view(`src/templates/todos.ejs`, { todos: db });
    } else {
        const newDb = [...db];
        newDb[idx].done = done;

        fs.writeFileSync(
            `${dirname}/../db.json`,
            JSON.stringify(newDb, undefined, 2),
        );

        return res.view(`src/templates/todos.ejs`, { todos: newDb });
    }
});

fastify.delete("/todo/:id", (req, res) => {
    const db = getDb();
    const id = req.params.id;
    if (!id) {
        return res.view(`src/templates/todos.ejs`, { todos: db });
    }

    const idx = db.findIndex((entry) => entry.id === id);
    if (idx === -1) {
        return res.view(`src/templates/todos.ejs`, { todos: db });
    } else {
        const newDb = [...db];
        newDb.splice(idx, 1);

        fs.writeFileSync(
            `${dirname}/../db.json`,
            JSON.stringify(newDb, undefined, 2),
        );

        return res.view(`src/templates/todos.ejs`, { todos: newDb });
    }
});

fastify.listen({ port: PORT, host: "0.0.0.0" }, () => {
    console.log("We're up!");
});

/**
 * @returns {Array<{title: string, done: boolean}>}
 */
function getDb() {
    try {
        const dbData = fs
            .readFileSync(`${dirname}/../db.json`)
            .toString("utf-8");
        const db = JSON.parse(dbData);

        return db;
    } catch {
        return [];
    }
}
