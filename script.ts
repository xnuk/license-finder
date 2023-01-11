import { tar, encodeUtf8 } from './tar.ts'

const { readTextFile, readDir } = Deno
const root = new URL(import.meta.resolve('./license-list-data/json/details/'))

type License = {
	crossRef: unknown[]
	deprecatedVersion?: string
	isDeprecatedLicenseId: boolean
	isFsfLibre?: boolean
	isOsiApproved?: boolean
	licenseComments?: string
	licenseId: string
	licenseText: string
	licenseTextHtml: string
	name: string
	seeAlso: string[]
	standardLicenseHeader?: string
	standardLicenseHeaderHtml?: string
	standardLicenseHeaderTemplate?: string
	standardLicenseTemplate: string
}

const fromAsync = async <T>(iter: AsyncIterable<T>) => {
	const ret = []
	for await (const a of iter) {
		ret.push(a)
	}
	return ret
}

const nonNull = <T>(v: T): v is Exclude<T, null | undefined> => v != null
const compact = <T>(v: readonly T[]) => v.filter(nonNull)

const licenseToEntry = (data: License) =>
	data.isDeprecatedLicenseId
		? null
		: ([data.licenseId, encodeUtf8(data.licenseText)] as const)

const main = async (outfile: string) =>
	Deno.writeFile(
		outfile,
		tar(
			Object.fromEntries(
				compact(
					await Promise.all(
						compact(
							(
								await fromAsync(readDir(root))
							).map(v =>
								v.isFile && v.name.endsWith('.json')
									? v.name
									: null
							)
						).map(async path =>
							licenseToEntry(
								JSON.parse(
									await readTextFile(new URL(path, root))
								)
							)
						)
					)
				)
			)
		)
	)

if (import.meta.main) {
	const outfile = Deno.args[0]
	if (outfile == null) {
		console.error('outfile must be given')
		Deno.exit(1)
	}
	main(outfile)
}
