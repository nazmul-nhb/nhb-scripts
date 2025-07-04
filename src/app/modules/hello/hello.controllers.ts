
import catchAsync from '../../utilities/catchAsync';
import sendResponse from '../../utilities/sendResponse';
import { helloServices } from './hello.services';
            
const getAllHellos = catchAsync(async (_req, res) => {
    const hellos = await helloServices.getAllHellosFromDB();

    sendResponse(res, 'Hello', 'GET', hellos);
});

export const helloControllers = { getAllHellos };
            