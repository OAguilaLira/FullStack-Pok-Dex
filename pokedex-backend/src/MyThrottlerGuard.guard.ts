import {
  Injectable,
  HttpException,
  HttpStatus,
  ExecutionContext,
} from '@nestjs/common';
import { ThrottlerGuard, ThrottlerLimitDetail } from '@nestjs/throttler';

@Injectable()
export class CustomThrottlerGuard extends ThrottlerGuard {
  async canActivate(context: ExecutionContext): Promise<boolean> {
    console.log('➡️ CustomThrottlerGuard canActivate llamado');
    return super.canActivate(context);
  }

  protected async throwThrottlingException(
    context: ExecutionContext,
    limit: ThrottlerLimitDetail,
  ): Promise<void> {
    console.log('🚫 Límite alcanzado');
    throw new HttpException(
      'Demasiadas solicitudes, por favor intenta más tarde.',
      HttpStatus.TOO_MANY_REQUESTS,
    );
  }
}