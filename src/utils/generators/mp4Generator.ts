/**
 * Writes a 32-bit unsigned integer to a Uint8Array in Big Endian format.
 * @param {number} value The integer to write.
 * @returns {Uint8Array} A 4-byte array.
 */
function writeUint32BE(value: number): Uint8Array {
  return new Uint8Array([
    (value >>> 24) & 0xFF,
    (value >>> 16) & 0xFF,
    (value >>> 8) & 0xFF,
    value & 0xFF
  ]);
}

/**
 * Concatenates multiple Uint8Array into a single one.
 * @param {...Uint8Array} arrays The arrays to concatenate.
 * @returns {Uint8Array} The concatenated array.
 */
function concatUint8(...arrays: Uint8Array[]): Uint8Array {
    const totalLength = arrays.reduce((acc, arr) => acc + arr.length, 0);
    const result = new Uint8Array(totalLength);
    let offset = 0;
    for (const arr of arrays) {
        result.set(arr, offset);
        offset += arr.length;
    }
    return result;
}

/**
 * Creates an MP4 box (atom).
 * A box is a basic data unit in an MP4 file, consisting of a size, a type, and data.
 * @param {string} type The 4-character box type.
 * @param {Uint8Array | Uint8Array[]} data The box's payload. Can be a single array or an array of arrays (for nested boxes).
 * @returns {Uint8Array} The complete box as a byte array.
 */
function createBox(type: string, data: Uint8Array | Uint8Array[]): Uint8Array {
    const typeBytes = new TextEncoder().encode(type);
    const dataArray = Array.isArray(data) ? data : [data];
    const dataLength = dataArray.reduce((acc, arr) => acc + arr.length, 0);
    const size = 8 + dataLength; // 4 bytes for size, 4 bytes for type

    const header = new Uint8Array(8);
    header.set(writeUint32BE(size), 0);
    header.set(typeBytes, 4);

    return concatUint8(header, ...dataArray);
}

/**
 * Generates a valid, playable, minimal MP4 file of a specific target size.
 * The generated file will be a very short (1 frame) 1x1 pixel black video with no audio.
 * @param {number} targetSize The desired file size in bytes.
 * @returns {Blob} The generated MP4 file as a Blob.
 */
export async function generateMP4(targetSize: number, onProgress?: (progress: number) => void, signal?: AbortSignal): Promise<Blob> {
    // ---- ATOM/BOX DEFINITIONS ----
    
    // ftyp (File Type Box): Identifies the file format.
    const ftyp = createBox('ftyp', new Uint8Array([
        ...new TextEncoder().encode('isom'), // Major brand
        0, 0, 0, 1,                         // Minor version
        ...new TextEncoder().encode('isom'), // Compatible brand 1
        ...new TextEncoder().encode('avc1'), // Compatible brand 2 (Advanced Video Coding)
    ]));

    // mvhd (Movie Header Box): Contains global movie metadata.
    const mvhd = createBox('mvhd', new Uint8Array([
        0, 0, 0, 0,                         // version(0) & flags(0)
        0, 0, 0, 0, 0, 0, 0, 0,             // creation_time & modification_time (set to 0)
        0, 0, 0x03, 0xE8,                   // timescale = 1000 (units per second)
        0, 0, 0x03, 0xE8,                   // duration = 1000 (1 second)
        0, 1, 0, 0,                         // preferred rate = 1.0
        1, 0,                               // preferred volume = 1.0
        0, 0, 0, 0, 0, 0, 0, 0, 0, 0,       // reserved
        // Identity matrix for video transformation
        0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
        0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
        0x40, 0, 0, 0,
        0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, // pre_defined
        0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
        0, 0, 0, 2,                         // next_track_ID
    ]));

    // tkhd (Track Header Box): Contains metadata for a single track.
    const tkhd = createBox('tkhd', new Uint8Array([
        0, 0, 0, 7,                         // version(0) & flags(track_enabled, track_in_movie, track_in_preview)
        0, 0, 0, 0, 0, 0, 0, 0,             // creation_time & modification_time
        0, 0, 0, 1,                         // track_ID = 1
        0, 0, 0, 0,                         // reserved
        0, 0, 0x03, 0xE8,                   // duration = 1000
        0, 0, 0, 0, 0, 0, 0, 0,             // reserved
        0, 0, 0, 0,                         // layer & alternate_group
        0, 0, 0, 0,                         // volume & reserved
        // Identity matrix
        0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
        0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
        0x40, 0, 0, 0,
        0, 1, 0, 0,                         // width = 1.0
        0, 1, 0, 0,                         // height = 1.0
    ]));

    // mdhd (Media Header Box): Contains media-specific metadata for a track.
    const mdhd = createBox('mdhd', new Uint8Array([
        0, 0, 0, 0,                         // version & flags
        0, 0, 0, 0, 0, 0, 0, 0,             // creation_time & modification_time
        0, 0, 0x03, 0xE8,                   // timescale = 1000
        0, 0, 0x03, 0xE8,                   // duration = 1000
        0x55, 0xC4, 0, 0,                   // language ('und' - undetermined) & pre_defined
    ]));

    // hdlr (Handler Reference Box): Specifies the media type ('vide' for video).
    const hdlr = createBox('hdlr', new Uint8Array([
        0, 0, 0, 0,                         // version & flags
        0, 0, 0, 0,                         // pre_defined
        ...new TextEncoder().encode('vide'),// handler_type
        0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, // reserved
        ...new TextEncoder().encode('VideoHandler'), // name
        0,                                  // null terminator
    ]));
    
    // vmhd (Video Media Header): Contains video-specific information.
    const vmhd = createBox('vmhd', new Uint8Array([
        0, 0, 0, 1, // version & flags
        0, 0,       // graphicsmode
        0, 0, 0, 0, 0, 0 // opcolor
    ]));
    
    // dref (Data Reference Box): Points to the location of the media data.
    const dref = createBox('dref', concatUint8(
        new Uint8Array([0, 0, 0, 0, 0, 0, 0, 1]), // version, flags, entry_count=1
        createBox('url ', new Uint8Array([0, 0, 0, 1])) // Self-contained data reference
    ));

    // dinf (Data Information Box): Container for dref.
    const dinf = createBox('dinf', [dref]);

    // Basic AVC Configuration Record (avcC) - minimal H.264 configuration
    const avcC = createBox('avcC', new Uint8Array([
        1,          // configurationVersion
        0x42,       // AVCProfileIndication (Baseline profile)
        0x00,       // profile_compatibility
        0x0A,       // AVCLevelIndication (Level 1.0)
        0xFF,       // lengthSizeMinusOne (4 bytes length)
        0xE1,       // numOfSequenceParameterSets (1)
        // SPS (Sequence Parameter Set) - minimal for 1x1 video
        0, 13,      // SPS length
        0x67, 0x42, 0x00, 0x0A, 0x89, 0x95, 0x42, 0x82, 0x83, 0xC4, 0x40, 0x6A, 0x02,
        0x01,       // numOfPictureParameterSets (1)
        // PPS (Picture Parameter Set) - minimal
        0, 4,       // PPS length
        0x68, 0xCE, 0x3C, 0x80
    ]));

    // avc1 (AVC Sample Entry): Describes the video codec (H.264) with avcC.
    const avc1 = createBox('avc1', concatUint8(
        new Uint8Array([
            0, 0, 0, 0, 0, 0, 0, 1,             // reserved & data_reference_index
            0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, // pre_defined
            0, 1, 0, 1,                         // width & height (1x1)
            0, 0x48, 0, 0, 0, 0x48, 0, 0,       // horizresolution & vertresolution (72 dpi)
            0, 0, 0, 0, 0, 1,                   // reserved & frame_count
            0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, // compressorname (32 bytes of 0)
            0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
            0, 0x18, 0xFF, 0xFF,                // depth & pre_defined = -1
        ]),
        avcC // Include the AVC configuration
    ));

    // stsd (Sample Description Box): Contains the avc1 box.
    const stsd = createBox('stsd', [
        new Uint8Array([0, 0, 0, 0, 0, 0, 0, 1]), // version, flags, entry_count=1
        avc1
    ]);

    // stts (Time To Sample Box): 1 sample with duration 1000
    const stts = createBox('stts', new Uint8Array([
        0, 0, 0, 0,     // version & flags
        0, 0, 0, 1,     // entry_count = 1
        0, 0, 0, 1,     // sample_count = 1
        0, 0, 0x03, 0xE8 // sample_duration = 1000
    ]));

    // stsc (Sample To Chunk Box): 1 sample in 1 chunk
    const stsc = createBox('stsc', new Uint8Array([
        0, 0, 0, 0,     // version & flags
        0, 0, 0, 1,     // entry_count = 1
        0, 0, 0, 1,     // first_chunk = 1
        0, 0, 0, 1,     // samples_per_chunk = 1
        0, 0, 0, 1      // sample_description_index = 1
    ]));

    // Minimal H.264 frame data (single black pixel I-frame)
    const h264Frame = new Uint8Array([
        0x00, 0x00, 0x00, 0x01, // NAL unit start code
        0x65, // NAL unit type (IDR frame)
        0x88, 0x80, 0x10, 0x00, 0x07, 0xFF, 0xC4
    ]);

    // Calculate positions
    const preliminaryHeader = concatUint8(
        ftyp,
        createBox('moov', [
            mvhd,
            createBox('trak', [
                tkhd,
                createBox('mdia', [
                    mdhd,
                    hdlr,
                    createBox('minf', [
                        vmhd,
                        dinf,
                        createBox('stbl', [
                            stsd,
                            stts,
                            stsc,
                            createBox('stsz', new Uint8Array([
                                0, 0, 0, 0,             // version & flags
                                0, 0, 0, h264Frame.length, // sample_size (all samples same size)
                                0, 0, 0, 1              // sample_count = 1
                            ])),
                            createBox('stco', new Uint8Array([0, 0, 0, 0, 0, 0, 0, 0])) // placeholder
                        ])
                    ])
                ])
            ])
        ])
    );

    const mdatHeaderSize = 8;
    const chunkOffset = preliminaryHeader.length + mdatHeaderSize;
    
    // stco (Chunk Offset Box): Points to the chunk in mdat
    const stco = createBox('stco', new Uint8Array([
        0, 0, 0, 0,     // version & flags
        0, 0, 0, 1,     // entry_count = 1
        ...writeUint32BE(chunkOffset) // chunk offset
    ]));

    // Rebuild with correct stco
    const header = concatUint8(
        ftyp,
        createBox('moov', [
            mvhd,
            createBox('trak', [
                tkhd,
                createBox('mdia', [
                    mdhd,
                    hdlr,
                    createBox('minf', [
                        vmhd,
                        dinf,
                        createBox('stbl', [
                            stsd,
                            stts,
                            stsc,
                            createBox('stsz', new Uint8Array([
                                0, 0, 0, 0,             // version & flags
                                0, 0, 0, h264Frame.length, // sample_size
                                0, 0, 0, 1              // sample_count = 1
                            ])),
                            stco
                        ])
                    ])
                ])
            ])
        ])
    );

    const headerSize = header.length;
    const frameDataSize = h264Frame.length;
    const mdatWithFrameSize = mdatHeaderSize + frameDataSize;
    const minSize = headerSize + mdatWithFrameSize;

    if (targetSize < minSize) {
        console.warn(`Target size ${targetSize} is too small for a playable MP4. Minimum is ${minSize}.`);
        return new Blob([header.slice(0, targetSize)], { type: 'video/mp4' });
    }

    // Create mdat with actual frame data
    const mdatSize = targetSize - headerSize;
    const mdat = new Uint8Array(mdatSize);
    mdat.set(writeUint32BE(mdatSize), 0);
    mdat.set(new TextEncoder().encode('mdat'), 4);
    mdat.set(h264Frame, 8);
    // Rest remains zeros (padding)

    const result = concatUint8(header, mdat);
    
    if (signal?.aborted) {
        throw new DOMException('Generation was aborted', 'AbortError');
    }
    
    if (onProgress) {
        onProgress(1);
    }
    
    return new Blob([result.buffer as ArrayBuffer], { type: 'video/mp4' });
}