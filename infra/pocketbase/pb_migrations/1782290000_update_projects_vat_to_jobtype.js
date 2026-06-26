/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("pbc_484305853");

  // Remove vatPercent field
  collection.fields.removeById("number1220080127");

  // Add jobType field
  collection.fields.addAt(3, new Field({
    "hidden": false,
    "id": "text_job_type",
    "max": 20,
    "min": 0,
    "name": "jobType",
    "pattern": "^(renovation|new-build)$",
    "presentable": false,
    "primaryKey": false,
    "required": true,
    "system": false,
    "type": "text"
  }));

  // Add grandTotal field
  collection.fields.add(new Field({
    "hidden": false,
    "id": "number_grand_total",
    "max": null,
    "min": 0,
    "name": "grandTotal",
    "onlyInt": false,
    "presentable": false,
    "required": false,
    "system": false,
    "type": "number"
  }));

  // Add customer_name field
  collection.fields.add(new Field({
    "hidden": false,
    "id": "text_customer_name",
    "max": 0,
    "min": 0,
    "name": "customerName",
    "pattern": "",
    "presentable": false,
    "primaryKey": false,
    "required": false,
    "system": false,
    "type": "text"
  }));

  // Add customer_email field
  collection.fields.add(new Field({
    "hidden": false,
    "id": "text_customer_email",
    "max": 0,
    "min": 0,
    "name": "customerEmail",
    "pattern": "",
    "presentable": false,
    "primaryKey": false,
    "required": false,
    "system": false,
    "type": "text"
  }));

  // Open access rules for MVP (no auth yet)
  collection.listRule = "";
  collection.viewRule = "";
  collection.createRule = "";
  collection.updateRule = "";
  collection.deleteRule = "";

  return app.save(collection);
}, (app) => {
  const collection = app.findCollectionByNameOrId("pbc_484305853");

  collection.fields.removeById("text_job_type");
  collection.fields.removeById("number_grand_total");
  collection.fields.removeById("text_customer_name");
  collection.fields.removeById("text_customer_email");

  collection.fields.addAt(3, new Field({
    "hidden": false,
    "id": "number1220080127",
    "max": null,
    "min": null,
    "name": "vatPercent",
    "onlyInt": false,
    "presentable": false,
    "required": true,
    "system": false,
    "type": "number"
  }));

  collection.listRule = null;
  collection.viewRule = null;
  collection.createRule = null;
  collection.updateRule = null;
  collection.deleteRule = null;

  return app.save(collection);
});
