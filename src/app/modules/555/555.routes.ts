
import { Router } from 'express';
import { 555Controllers } from './555.controllers';

const router = Router();

router.get('/', 555Controllers.getAll555s);

export const 555Routes = router;
            