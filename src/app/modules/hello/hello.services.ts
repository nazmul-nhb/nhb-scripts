
import { QueryBuilder } from '../../classes/QueryBuilder';
import { Hello } from './hello.model';

const getAllHellosFromDB = async (query?: Record<string, unknown>) => {
    const helloQuery = new QueryBuilder(Hello.find(), query).sort();
    // const hellos = await Hello.find({});

    const hellos = await helloQuery.modelQuery;

    return hellos;
};

export const helloServices = { getAllHellosFromDB };
            