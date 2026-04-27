const fs = require('fs');
const path = require('path');
const pug = require('pug');

const blacklist = new Set(require('../blacklist.json'));
const allApplications = require('../applications.json');

// Compile the Pug template
const apps = allApplications
  .filter(app => !blacklist.has(app.id))
  .map(app => ({
    id: app.id,
    label: app.label,
    ...(app.invalid ? { color: { border: 'red', background: 'red' }, } : {}),
    ...(app.exists === false ? { color: { border: 'grey', background: 'lightgray' }, } : {}),
  }));

const dependencies = allApplications
  .filter(({ id, dependencies }) => dependencies && dependencies.length && !blacklist.has(id))
  .map(({ id, dependencies: appDependencies }) => {
    return appDependencies
      .filter(dependency => !blacklist.has(dependency.id))
      .map(dependency => ({
        from: id,
        to: dependency.id,
        dashes: dependency.optional,
        ...(dependency.invalidDependency ? { color: { color: 'red' }, } : {}),
        ...(dependency.exists === false ? { color: { color: 'grey' }, } : {}),
        title: dependency.comment,
      }))
  })
  .flat();

const compileTemplate = pug.compileFile(
  path.join(__dirname, 'templates', 'index.pug'),
  { pretty: true }
);

const renderTemplate = () => compileTemplate({ apps, dependencies, appsCount: apps.length });

// Generate HTML content from the Pug template
const htmlContent = renderTemplate();

// Define the output path for the generated HTML file
const outputPath = path.join(__dirname, '../dist/index.html');

// Write the generated HTML content to the output file
fs.mkdir(path.dirname(outputPath), { recursive: true }, (dirErr) => {
  if (dirErr) {
    console.error('Error creating directory:', dirErr);
    return;
  }

  fs.writeFile(outputPath, htmlContent, { flag: 'w' }, (err) => {
    if (err) {
      console.error('Error writing file:', err);
    } else {
      console.log('index.html has been generated in the dist folder.');
    }
  });
});
