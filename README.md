<p align="center">
  <a href="http://nestjs.com/" target="blank"><img src="https://nestjs.com/img/logo-small.svg" width="120" alt="Nest Logo" /></a>
</p>

[circleci-image]: https://img.shields.io/circleci/build/github/nestjs/nest/master?token=abc123def456
[circleci-url]: https://circleci.com/gh/nestjs/nest

  <p align="center">A progressive <a href="http://nodejs.org" target="_blank">Node.js</a> framework for building efficient and scalable server-side applications.</p>
    <p align="center">
<a href="https://www.npmjs.com/~nestjscore" target="_blank"><img src="https://img.shields.io/npm/v/@nestjs/core.svg" alt="NPM Version" /></a>
<a href="https://www.npmjs.com/~nestjscore" target="_blank"><img src="https://img.shields.io/npm/l/@nestjs/core.svg" alt="Package License" /></a>
<a href="https://www.npmjs.com/~nestjscore" target="_blank"><img src="https://img.shields.io/npm/dm/@nestjs/common.svg" alt="NPM Downloads" /></a>
<a href="https://circleci.com/gh/nestjs/nest" target="_blank"><img src="https://img.shields.io/circleci/build/github/nestjs/nest/master" alt="CircleCI" /></a>
<a href="https://discord.gg/G7Qnnhy" target="_blank"><img src="https://img.shields.io/badge/discord-online-brightgreen.svg" alt="Discord"/></a>
<a href="https://opencollective.com/nest#backer" target="_blank"><img src="https://opencollective.com/nest/backers/badge.svg" alt="Backers on Open Collective" /></a>
<a href="https://opencollective.com/nest#sponsor" target="_blank"><img src="https://opencollective.com/nest/sponsors/badge.svg" alt="Sponsors on Open Collective" /></a>
  <a href="https://paypal.me/kamilmysliwiec" target="_blank"><img src="https://img.shields.io/badge/Donate-PayPal-ff3f59.svg" alt="Donate us"/></a>
    <a href="https://opencollective.com/nest#sponsor"  target="_blank"><img src="https://img.shields.io/badge/Support%20us-Open%20Collective-41B883.svg" alt="Support us"></a>
  <a href="https://twitter.com/nestframework" target="_blank"><img src="https://img.shields.io/twitter/follow/nestframework.svg?style=social&label=Follow" alt="Follow us on Twitter"></a>
</p>
  <!--[![Backers on Open Collective](https://opencollective.com/nest/backers/badge.svg)](https://opencollective.com/nest#backer)
  [![Sponsors on Open Collective](https://opencollective.com/nest/sponsors/badge.svg)](https://opencollective.com/nest#sponsor)-->

## Description

[Nest](https://github.com/nestjs/nest) framework TypeScript starter repository.

## Project setup

```bash
$ npm install
```

## Compile and run the project

```bash
# development
$ npm run start

# watch mode
$ npm run start:dev

# production mode
$ npm run start:prod
```

## Run tests

```bash
# unit tests
$ npm run test

# e2e tests
$ npm run test:e2e

# test coverage
$ npm run test:cov
```

## Deployment

When you're ready to deploy your NestJS application to production, there are some key steps you can take to ensure it runs as efficiently as possible. Check out the [deployment documentation](https://docs.nestjs.com/deployment) for more information.

If you are looking for a cloud-based platform to deploy your NestJS application, check out [Mau](https://mau.nestjs.com), our official platform for deploying NestJS applications on AWS. Mau makes deployment straightforward and fast, requiring just a few simple steps:

```bash
$ npm install -g @nestjs/mau
$ mau deploy
```

With Mau, you can deploy your application in just a few clicks, allowing you to focus on building features rather than managing infrastructure.

## Resources

Check out a few resources that may come in handy when working with NestJS:

- Visit the [NestJS Documentation](https://docs.nestjs.com) to learn more about the framework.
- For questions and support, please visit our [Discord channel](https://discord.gg/G7Qnnhy).
- To dive deeper and get more hands-on experience, check out our official video [courses](https://courses.nestjs.com/).
- Deploy your application to AWS with the help of [NestJS Mau](https://mau.nestjs.com) in just a few clicks.
- Visualize your application graph and interact with the NestJS application in real-time using [NestJS Devtools](https://devtools.nestjs.com).
- Need help with your project (part-time to full-time)? Check out our official [enterprise support](https://enterprise.nestjs.com).
- To stay in the loop and get updates, follow us on [X](https://x.com/nestframework) and [LinkedIn](https://linkedin.com/company/nestjs).
- Looking for a job, or have a job to offer? Check out our official [Jobs board](https://jobs.nestjs.com).

## Support

Nest is an MIT-licensed open source project. It can grow thanks to the sponsors and support by the amazing backers. If you'd like to join them, please [read more here](https://docs.nestjs.com/support).

## Stay in touch

- Author - [Kamil Myśliwiec](https://twitter.com/kammysliwiec)
- Website - [https://nestjs.com](https://nestjs.com/)
- Twitter - [@nestframework](https://twitter.com/nestframework)

## License

Nest is [MIT licensed](https://github.com/nestjs/nest/blob/master/LICENSE).

```
starkbay_API
├─ .prettierrc
├─ eslint.config.mjs
├─ nest-cli.json
├─ package-lock.json
├─ package.json
├─ README.md
├─ src
│  ├─ analytics
│  │  ├─ analytics.controller.ts
│  │  ├─ analytics.module.ts
│  │  ├─ analytics.service.ts
│  │  ├─ customer-behavior
│  │  │  └─ behavior.service.ts
│  │  ├─ dashboard
│  │  │  └─ dashboard.controller.ts
│  │  ├─ dto
│  │  │  └─ event.dto.ts
│  │  ├─ events
│  │  │  ├─ event.entity.ts
│  │  │  └─ event.service.ts
│  │  ├─ product-performance
│  │  │  └─ product-metrics.service.ts
│  │  └─ sales
│  │     └─ sales-metrics.service.ts
│  ├─ app.controller.spec.ts
│  ├─ app.controller.ts
│  ├─ app.module.ts
│  ├─ app.service.ts
│  ├─ auth
│  │  ├─ decorators
│  │  │  └─ current-user.decorator.ts
│  │  └─ guards
│  │     ├─ admin.guard.ts
│  │     └─ jwt-auth.guard.ts
│  ├─ config
│  │  └─ database.config.ts
│  ├─ content
│  │  ├─ content.controller.ts
│  │  ├─ content.module.ts
│  │  ├─ content.service.ts
│  │  ├─ dto
│  │  │  ├─ content-query.dto.ts
│  │  │  ├─ create-content.dto.ts
│  │  │  └─ update-content.dto.ts
│  │  ├─ entities
│  │  │  ├─ content-analytics.entity.ts
│  │  │  ├─ content-category.entity.ts
│  │  │  ├─ content-tag.entity.ts
│  │  │  └─ content.entity.ts
│  │  └─ enums
│  │     └─ content.enums.ts
│  ├─ coupons
│  │  ├─ coupons.controller.ts
│  │  ├─ coupons.module.ts
│  │  ├─ coupons.service.ts
│  │  ├─ dto
│  │  │  └─ create-coupon.dto.ts
│  │  └─ entities
│  │     ├─ coupon-usage.entity.ts
│  │     └─ coupon.entity.ts
│  ├─ events
│  │  ├─ controllers
│  │  │  └─ events.controller.ts
│  │  ├─ decorators
│  │  │  ├─ event-handler.decorator.ts
│  │  │  └─ event-subscriber.decorator.ts
│  │  ├─ entities
│  │  │  └─ event-store.entity.ts
│  │  ├─ events.module.ts
│  │  ├─ services
│  │  │  ├─ event-emitter.service.ts
│  │  │  ├─ event-monitoring.service.ts
│  │  │  ├─ event-replay.service.ts
│  │  │  ├─ event-store.service.ts
│  │  │  └─ event-subscriber.service.ts
│  │  ├─ types
│  │  │  └─ event.types.ts
│  │  └─ validators
│  │     └─ event-payload.validator.ts
│  ├─ indexing-strategy
│  │  ├─ controllers
│  │  │  └─ index-admin.controller.ts
│  │  ├─ decorators
│  │  │  └─ index-monitoring.decorator.ts
│  │  ├─ dto
│  │  │  └─ index.dto.ts
│  │  ├─ entities
│  │  │  └─ indexing-strategy.entity.ts
│  │  ├─ indexing-strategy.controller.spec.ts
│  │  ├─ indexing-strategy.controller.ts
│  │  ├─ indexing-strategy.module.ts
│  │  ├─ indexing-strategy.service.spec.ts
│  │  ├─ indexing-strategy.service.ts
│  │  ├─ interceptors
│  │  │  └─ query-performance.interceptor.ts
│  │  ├─ interfaces
│  │  │  └─ index.interface.ts
│  │  ├─ services
│  │  │  ├─ index-maintenance.service.ts
│  │  │  ├─ index-management.service.ts
│  │  │  ├─ index-monitoring.service.ts
│  │  │  ├─ index-suggestion.service.ts
│  │  │  ├─ performance-alerts.service.ts
│  │  │  └─ query-analysis.service.ts
│  │  └─ utils
│  │     └─ query-parser.util.ts
│  ├─ main.ts
│  ├─ management
│  │  └─ entities
│  │     ├─ dto
│  │     │  ├─ create-order.dto.ts
│  │     │  ├─ order.controller.ts
│  │     │  ├─ order.module.ts
│  │     │  └─ order.service.ts
│  │     └─ order.entity.ts
│  ├─ migration
│  │  ├─ 1703123456789-CreateUserTable.ts
│  │  ├─ migration-dependency.service.ts
│  │  ├─ migration-test.service.ts
│  │  ├─ migration.controller.ts
│  │  ├─ migration.module.ts
│  │  ├─ migration.service.ts
│  │  └─ test
│  │     ├─ migration-setup.ts
│  │     ├─ migration.utils.ts
│  │     └─ migrations
│  │        ├─ 1703123456790-AddUserProfile.ts
│  │        ├─ CreateUserTable.migration.spec.ts
│  │        └─ scripts
│  │           └─ ci-migration-check.ts
│  ├─ migrations
│  │  └─ 001-enable-pg-stat-statements.sql
│  ├─ order
│  │  ├─ entities
│  │  │  ├─ order-item.entity.ts
│  │  │  └─ order.entity.ts
│  │  └─ order.service.ts
│  ├─ product
│  │  └─ product.entity.ts
│  ├─ review
│  │  ├─ dto
│  │  │  ├─ create-review.dto.ts
│  │  │  ├─ moderate-review.dto.ts
│  │  │  ├─ review-query.dto.ts
│  │  │  ├─ update-review.dto.ts
│  │  │  └─ vote-review.dto.ts
│  │  ├─ entities
│  │  │  ├─ product-rating.entity.ts
│  │  │  ├─ review-vote.entity.ts
│  │  │  └─ review.entity.ts
│  │  ├─ review.controller.ts
│  │  ├─ review.module.ts
│  │  ├─ review.service.ts
│  │  └─ services
│  │     └─ moderation.service.ts
│  ├─ tax
│  │  ├─ controllers
│  │  │  ├─ report.controller.ts
│  │  │  └─ tax.controller.ts
│  │  ├─ dto
│  │  │  └─ calculate-tax.dto.ts
│  │  ├─ entities
│  │  │  ├─ jurisdiction.entity.ts
│  │  │  ├─ product-category.entity.ts
│  │  │  ├─ tax-exemption.entity.ts
│  │  │  ├─ tax-transaction.entity.ts
│  │  │  └─ tax.entity.ts
│  │  ├─ services
│  │  │  ├─ exemption.service.ts
│  │  │  ├─ tax-report.service.ts
│  │  │  └─ tax.service.ts
│  │  └─ shared
│  │     └─ base.entity.ts
│  ├─ user
│  │  └─ user.entity.ts
│  ├─ wishlist
│  │  ├─ dto
│  │  │  ├─ add-to-wishlist.dto.ts
│  │  │  ├─ move-to-cart.dto.ts
│  │  │  └─ remove-from-wishlist.dto.ts
│  │  ├─ entities
│  │  │  └─ wishlist.entity.ts
│  │  ├─ wishlist.controller.ts
│  │  └─ wishlist.service.ts
│  └─ workflow
│     ├─ dto
│     │  └─ approval.dto.ts
│     ├─ entities
│     │  └─ content-approval.entity.ts
│     ├─ workflow.controller.ts
│     ├─ workflow.module.ts
│     └─ workflow.service.ts
├─ test
│  ├─ app.e2e-spec.ts
│  └─ jest-e2e.json
├─ tsconfig.build.json
└─ tsconfig.json

```