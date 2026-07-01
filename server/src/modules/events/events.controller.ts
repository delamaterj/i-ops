import { Request, Response } from "express";
import { getEventDetailsService, createEventService } from "./events.service";

function getSingleParam(
    param: string | string[] | undefined
): string {

    if (!param) {
        throw new Error("Missing param");
    }

    return Array.isArray(param)
        ? param[0]
        : param;
}

export async function getEventDetails(req: Request, res: Response) {

    try {

        const eventId = getSingleParam(req.params.id);
        const userId = req.user?.userId;

        if (!userId) {
            return res.status(401).json({message: "Unauthorized"});
        }

        const result = await getEventDetailsService(eventId, userId);

        if (!result) {
            return res.status(404).json({message: "Event not found"});
        }

        return res.status(200).json(result);

    } catch (err) {
        
        return res.status(500).json({error: "Error finding event"});
    }

}

export async function createEvent(req: Request, res: Response) {

    try {
        const userId = req.user?.userId;
        if (!userId) {
            return res.status(401).json({message: "Unauthorized"});
        }
        const result = await createEventService(req.body, userId);
        return res.status(201).json(result);
    }

    catch (err) {
        return res.status(500).json({message: "Failed to create event"});
    }

}