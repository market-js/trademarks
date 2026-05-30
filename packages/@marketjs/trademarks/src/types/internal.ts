import type {
    OriginalTM as OriginalTM,
    Spec,
    UnknownService,
    UnknownTM,
    Supply,
    ServiceSupply
} from "#types/public"
import type { Deps, MarketPlan, ToSpecify } from "#types/records"
import type { Merge } from "#utils"

export interface TM<NAME extends string = string, TYPE = unknown> {
    name: NAME
    of: <THIS extends UnknownTM, VALUE extends TYPE>(
        this: THIS,
        value: VALUE
    ) => Supply<THIS>
    _type: TYPE
    /**
     * Opaque value attached at trademark creation by an adapter (e.g. a React
     * Context, a Vue inject key, an AsyncLocalStorage instance). Core
     * trademarks does not interpret this field — it just stores it for the
     * adapter to consume.
     */
    _context?: unknown
}

export type Factory<
    TYPE,
    REQUIRED extends OriginalTM[] = [],
    OPTIONALS extends Spec[] = []
> = (
    deps: Deps<{
        required: REQUIRED
        optionals: OPTIONALS
    }>,
    ctx: Ctx<{
        required: REQUIRED
        optionals: OPTIONALS
    }>
) => TYPE

type Warmup<
    TYPE,
    REQUIRED extends OriginalTM[] = [],
    OPTIONALS extends Spec[] = []
> = (
    value: TYPE,
    deps: Deps<{
        required: REQUIRED
        optionals: OPTIONALS
    }>
) => void

export type PartialServicePlan<
    TYPE,
    REQUIRED extends OriginalTM[] = [],
    OPTIONALS extends Spec[] = []
> = {
    required?: [...REQUIRED]
    optionals?: [...OPTIONALS]
    factory: Factory<TYPE, REQUIRED, OPTIONALS>
    warmup?: Warmup<TYPE, REQUIRED, OPTIONALS>
    context?: unknown
}

export type ServicePlan<
    TYPE,
    REQUIRED extends OriginalTM[],
    OPTIONALS extends Spec[]
> = {
    required: [...REQUIRED]
    optionals: [...OPTIONALS]
    factory: Factory<TYPE, REQUIRED, OPTIONALS>
    warmup: Warmup<TYPE, REQUIRED, OPTIONALS>
    context?: unknown
}

export type UnknownServicePlan = ServicePlan<unknown, OriginalTM[], Spec[]>

/**
 * ctx transforms services into contextualized services that can be bought again with new request supplies.
 * This enables dynamic dependency injection within a service's factory.
 * @typeParam SERVICE - The current service providing context
 * @returns A function that takes a service and returns it with a contextualized buy method
 * @public
 */
export type Ctx<
    CALLER_PLAN extends Pick<UnknownServicePlan, "optionals" | "required">
> = <TM extends UnknownTM>(
    tm: TM & (UnknownTM | Spec)
) => TM extends UnknownService ?
    Merge<
        TM,
        {
            _caller: Merge<
                ServiceSupply<UnknownService>,
                { market: MarketPlan<CALLER_PLAN> }
            >
            _toSpecify: Omit<TM["_toSpecify"], keyof ToSpecify<CALLER_PLAN>> &
                Partial<ToSpecify<CALLER_PLAN>>
        }
    >
:   TM & Spec // simply returns the service itself if it's a request service (noop)
