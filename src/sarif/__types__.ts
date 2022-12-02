import * as z from 'zod'

export const Count = z.preprocess((x: unknown) => {
  if (typeof x === 'string') {
    return parseFloat(x)
  }
  return x
}, z.number().int().gte(0))

export const SarifProperties = z
  .object({
    comment: z.string(),
    error_count: Count,
    execution_time: z.preprocess((x: unknown) => {
      if (x === undefined) {
        return undefined
      }
      parseFloat(x as string)
    }, z.number().optional()),
    test_count: Count,
    test_name: z.string(),
    tests_skipped: Count,
  })
  .partial()
  .strict()

export const SarifPhysicalLocation = z.object({
  artifactLocation: z
    .object({
      uri: z.string(),
      index: z.number().int(),
    })
    .strict(),
  region: z
    .object({
      startLine: Count,
      startColumn: Count.optional(),
      endLine: Count.optional(),
      message: z
        .object({
          text: z.string(),
        })
        .strict()
        .optional(),
    })
    .strict(),
})

export const SarifLocation = z.object({
  physicalLocation: SarifPhysicalLocation.strict().optional(),
})

export const SarifResult = z
  .object({
    ruleId: z.string(),
    level: z.enum(['error', 'warning']),
    kind: z.enum(['review', 'unknown', 'null']).optional(),
    message: z
      .object({
        text: z.string(),
      })
      .strict(),
    locations: z.array(SarifLocation),
  })
  .strict()

export const SarifRun = z
  .object({
    artifacts: z.array(
      z
        .object({
          location: z.object({
            uri: z.string(),
            uriBasedId: z.string().optional(),
          }),
        })
        .strict(),
    ),
    results: z.array(SarifResult),
    tool: z.object({
      driver: z
        .object({
          informationUri: z.string().url(),
          name: z.string(),
          rules: z.array(
            z
              .object({
                id: z.string(),
                shortDescription: z
                  .object({
                    text: z.string(),
                  })
                  .strict()
                  .optional(),
                helpUri: z.string().url().optional(),
              })
              .strict(),
          ),
          version: z.string().optional(),
        })
        .strict(),
    }),
  })
  .strict()

export const Sarif = z
  .object({
    $schema: z.string().url(),
    version: z.string(),
    properties: SarifProperties.optional(),
    runs: z.array(SarifRun),
  })
  .strict()
export type Sarif = z.infer<typeof Sarif>

export const ConsolidatedSarif = z.object({
  name: SarifRun.shape.tool.shape.driver.shape.name,
  message: SarifResult.shape.message.shape.text,
  level: SarifResult.shape.level,
  ruleId: SarifResult.shape.ruleId,
  line: SarifPhysicalLocation.shape.region.shape.startLine.optional(),
  file: SarifPhysicalLocation.shape.artifactLocation.shape.uri.optional(),
})
export type ConsolidatedSarif = z.infer<typeof ConsolidatedSarif>
