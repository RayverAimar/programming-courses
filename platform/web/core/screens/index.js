import * as home from "./home.js";
import * as courses from "./courses.js";
import * as syllabus from "./syllabus.js";
import * as lesson from "./lesson.js";
import * as progress from "./progress.js";
import * as settings from "./settings.js";
import * as download from "./download.js";
import * as gallery from "./gallery.js";
import * as finished from "./finished.js";
import * as notFound from "./notfound.js";

export const SCREENS = {
  home,
  cursos: courses,
  syllabus,
  lesson,
  progreso: progress,
  ajustes: settings,
  app: download,
  _componentes: gallery,
  finished,
  unknown: notFound,
};
