
import { Router } from 'express';
import { helloControllers } from './hello.controllers';

const router = Router();

router.get('/', helloControllers.getAllHellos);

export const helloRoutes = router;
            