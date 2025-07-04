
import catchAsync from '../../utilities/catchAsync';
import sendResponse from '../../utilities/sendResponse';
import { 555Services } from './555.services';
            
const getAll555s = catchAsync(async (_req, res) => {
    const 555s = await 555Services.getAll555sFromDB();

    sendResponse(res, '555', 'GET', 555s);
});

export const 555Controllers = { getAll555s };
            