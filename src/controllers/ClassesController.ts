import { Request, Response } from "express";
import db from "../database/connection";
import convertHourToMinute from "../utils/convertHourToMinute";

interface ScheduleItem {
  week_day: number;
  from: string;
  to: string;
}

export default class ClassesController {
  async index(request: Request, response: Response) {
    const filter = request.query;

    if (!filter.subject || !filter.week_day || !filter.time) {
      return response
        .status(400)
        .json({ error: "Missing filters to search classes" });
    }

    const timeInMinutes = convertHourToMinute(filter.time as string);

    const classes = await db("classes")
      .whereExists(function () {
        this.select("class_schedule.*")
          .from("class_schedule")
          .whereRaw("`class_schedule`.`class_id` = `classes`.`id`")
          .whereRaw("`class_schedule`.`week_day` = ??", [
            Number(filter.week_day as string),
          ])
          .whereRaw("`class_schedule`.`from` <= ??", [timeInMinutes])
          .whereRaw("`class_schedule`.`to` > ??", [timeInMinutes]);
      })
      .where("classes.subject", "=", filter.subject as string)
      .join("users", "classes.user_id", "=", "users.id")
      .select("classes.*", "users.*");
    //.where("classes.week_day", "=", filter.week_day as string);

    return response.json(classes);
  }

  async create(request: Request, response: Response) {
    const {
      name,
      avatar,
      whatsapp,
      bio,
      subject,
      cost,
      schedule,
    } = request.body;

    const trx = await db.transaction();

    try {
      const insertedUsersIds = await trx("users").insert({
        name,
        avatar,
        whatsapp,
        bio,
      });

      const insertedClassesIds = await trx("classes").insert({
        subject,
        cost,
        user_id: insertedUsersIds[0],
      });

      const classId = insertedClassesIds[0];

      const classSchecule = schedule.map((scheduleItem: ScheduleItem) => {
        return {
          week_day: scheduleItem.week_day,
          from: convertHourToMinute(scheduleItem.from),
          to: convertHourToMinute(scheduleItem.to),
          class_id: classId,
        };
      });

      await trx("class_schedule").insert(classSchecule);

      await trx.commit();

      return response.status(201).send();
    } catch (error) {
      await trx.rollback();

      return response
        .status(400)
        .json({ message: "Unexpected error while creating new class" });
    }
  }
}
