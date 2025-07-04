
import { QueryBuilder } from '../../classes/QueryBuilder';
import { 555 } from './555.model';

const getAll555sFromDB = async (query?: Record<string, unknown>) => {
    const 555Query = new QueryBuilder(555.find(), query).sort();
    // const 555s = await 555.find({});

    const 555s = await 555Query.modelQuery;

    return 555s;
};

export const 555Services = { getAll555sFromDB };
            