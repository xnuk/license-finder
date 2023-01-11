export const encodeUtf8 = (() => {
	const encoder = new TextEncoder()
	return (str: string): Uint8Array => encoder.encode(str)
})()

const encodeNumber = (num: number, size: 8 | 12): Uint8Array => {
	/*
	From `man tar.5`:
	> Numeric values are encoded in octal numbers using ASCII digits,
	> with leading zeroes. For historical reasons, a final NUL or space
	> character should also be used. Thus although there are 12 bytes
	> reserved for storing the file size, only 11 octal digits can be stored.
	*/

	const ret = new Uint8Array(size)
	ret.set(encodeUtf8((num | 0).toString(8).padStart(size - 1, '0')), 0)
	return ret
}

const setChecksum = (header: Uint8Array) => {
	/*
	From: https://www.gnu.org/software/tar/manual/html_node/Standard.html
	> The chksum field represents the simple sum of all bytes in the header
	> block. Each 8-bit byte in the header is added to an unsigned integer,
	> initialized to zero, the precision of which shall be no less than
	> seventeen bits. When calculating the checksum, the chksum field is
	> treated as if it were all blanks (ASCII 32).
	*/

	const offset = 148
	header.set(encodeUtf8(' '.repeat(8)), offset)
	const sum = header.reduce((p, c) => p + c)
	header.set(encodeNumber(sum, 8), offset)
}

const fileHeader = (filename: string, size: number): Uint8Array => {
	const chunk = new Uint8Array(512)
	chunk.set(encodeUtf8(filename).subarray(0, 100), 0)
	chunk.set(encodeUtf8('0000400'), 100) // read
	chunk.set(encodeNumber(size, 8), 124)
	setChecksum(chunk)
	return chunk
}

const fileEntry = (filename: string, content: Uint8Array): Uint8Array => {
	const size = content.byteLength
	const paddedLen = Math.ceil(size / 512) * 512
	const entry = new Uint8Array(paddedLen + 512)
	entry.set(fileHeader(filename, size), 0)
	entry.set(content, 512)
	return entry
}

const end = new Uint8Array(1024)

const concat = (...args: Uint8Array[]): Uint8Array => {
	const ret = new Uint8Array(args.reduce((p, c) => p + c.byteLength, 0))
	let offset = 0
	for (const arr of args) {
		ret.set(arr, offset)
		offset += arr.byteLength
	}

	return ret
}

export const tar = (files: { [key: string]: Uint8Array }): Uint8Array => {
	const raw = Object.entries(files).map(x => fileEntry.apply(null, x))
	raw.push(end)
	return concat.apply(null, raw)
}
