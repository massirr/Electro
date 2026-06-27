/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  // ── projects: add owner + customerAddress ────────────────────────────────
  const projects = app.findCollectionByNameOrId("pbc_484305853");

  projects.fields.add(new Field({
    "collectionId": "_pb_users_auth_",
    "cascadeDelete": false,
    "help": "",
    "hidden": false,
    "id": "relation_owner",
    "maxSelect": 1,
    "minSelect": 0,
    "name": "owner",
    "presentable": false,
    "required": false,
    "system": false,
    "type": "relation",
  }));

  projects.fields.add(new Field({
    "autogeneratePattern": "",
    "help": "",
    "hidden": false,
    "id": "text_customer_address",
    "max": 0,
    "min": 0,
    "name": "customerAddress",
    "pattern": "",
    "presentable": false,
    "primaryKey": false,
    "required": false,
    "system": false,
    "type": "text",
  }));

  app.save(projects);

  // ── users: add btwNumber + hourlyRate ────────────────────────────────────
  const users = app.findCollectionByNameOrId("_pb_users_auth_");

  users.fields.add(new Field({
    "autogeneratePattern": "",
    "help": "",
    "hidden": false,
    "id": "text_btw_number",
    "max": 0,
    "min": 0,
    "name": "btwNumber",
    "pattern": "",
    "presentable": false,
    "primaryKey": false,
    "required": false,
    "system": false,
    "type": "text",
  }));

  users.fields.add(new Field({
    "help": "",
    "hidden": false,
    "id": "number_hourly_rate",
    "max": null,
    "min": 0,
    "name": "hourlyRate",
    "onlyInt": false,
    "presentable": false,
    "required": false,
    "system": false,
    "type": "number",
  }));

  return app.save(users);
}, (app) => {
  const projects = app.findCollectionByNameOrId("pbc_484305853");
  projects.fields.removeById("relation_owner");
  projects.fields.removeById("text_customer_address");
  app.save(projects);

  const users = app.findCollectionByNameOrId("_pb_users_auth_");
  users.fields.removeById("text_btw_number");
  users.fields.removeById("number_hourly_rate");
  return app.save(users);
});
