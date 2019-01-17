/*
 * "This work is created by NimbusWeb and is copyrighted by NimbusWeb. (c) 2017 NimbusWeb.
 * You may not replicate, copy, distribute, or otherwise create derivative works of the copyrighted
 * material without prior written permission from NimbusWeb.
 *
 * Certain parts of this work contain code licensed under the MIT License.
 * https://www.webrtc-experiment.com/licence/ THE SOFTWARE IS PROVIDED "AS IS",
 * WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO
 * THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT.
 * IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
 * DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE,
 * ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
 * */

var nacl_module = {
    listener: null,
    path: 'filesystem:chrome-extension://' + chrome.i18n.getMessage("@@extension_id") + '/persistent/',
    video_resolution: {
        1: {width: 640, height: 360},
        2: {width: 960, height: 540},
        3: {width: 1280, height: 720},
        4: {width: 1600, height: 900},
        5: {width: 1920, height: 1080},
        6: {width: 2048, height: 1152},
        7: {width: 3200, height: 1800},
        8: {width: 3840, height: 2160}
    },
    frame_rate: {
        1: 5,
        2: 10,
        3: 15,
        4: 20,
        5: 25
    },
    blobToFile: function (cb) {
        nimbus_screen.info.file.patch = nacl_module.path + 'video.webm';
        nimbus_screen.info.file.format = 'webm';

        // nimbus_screen.urlToBlob(nimbus_screen.info.file.patch, function (blob) {
        //     nimbus_screen.info.file.blob = blob;
        //     nimbus_screen.info.file.size = Math.floor(blob.size);
        //     // nimbus_screen.checkWaterMark(function (check) {
        //     if (localStorage.videoReEncoding === 'true'/* || check*/) {
        //         nacl_module.reEncoding(cb);
        //     } else {
        //         tracker.send(VIDEO_USING);
        //
        //         if (cb) return cb();
        //         else nimbus_screen.viewFilePreview();
        //     }
        //     // })
        // });

        if (localStorage.videoReEncoding === 'true') {
            nacl_module.reEncoding(cb);
        } else {
            nimbus_screen.urlToBlob(nimbus_screen.info.file.patch, function (blob) {
                nimbus_screen.info.file.blob = blob;
                nimbus_screen.info.file.size = Math.floor(blob.size);

                tracker.send(VIDEO_USING);
                nimbus_screen.viewFilePreview();
            });
        }
    },
    reEncoding: function (cb) {
        let ffmpeg_convert = new FFMPEG_CONVERT();
        let params = [];

        params.push("-fflags");
        params.push("+genpts");
        params.push("-i");
        params.push("/fs/video.webm");
        params.push("-c:a");
        params.push("copy");
        params.push("-c:v");
        params.push("copy");
        params.push("/fs/video-encode.webm");

        ffmpeg_convert.start(params, null,
            function (f) {
                if (f) {
                    tracker.send(VIDEO_USING);

                    nacl_module.setWaterMark(function (set, params) {
                        if (set) {
                            nacl_module.convert({format: 'watermark', params: params}, cb);
                        } else {
                            nimbus_screen.info.file.patch = nacl_module.path + 'video-encode.webm';
                            nimbus_screen.info.file.format = 'webm';

                            nimbus_screen.urlToBlob(nimbus_screen.info.file.patch, function (blob) {
                                nimbus_screen.info.file.blob = blob;
                                nimbus_screen.info.file.size = Math.floor(blob.size);

                                if (cb) return cb();
                                else nimbus_screen.viewFilePreview();
                            });
                        }
                    });
                }
            }, function (msg) {
                ffmpeg_convert.set_active();
            });
    },
    createPalette: function (req, cb) {
        console.log('--createPalette--');

        let params = [];
        params.push("-i");
        params.push("/html5_persistent/video.webm");
        params.push("-vf");
        params.push("fps=" + req.frame_rate + ",scale=" + req.size.width + ":-1:flags=lanczos,palettegen");
        params.push("/html5_persistent/palette.png");

        let ffmpeg_convert = new FFMPEG_CONVERT();

        ffmpeg_convert.start(params, null,
            function (f) {
                if (f) {
                    cb && cb();
                }
            }, function () {

            });
    },
    setWaterMark: function (cb) {
        core.checkWaterMark(function (check) {
            if (check && (localStorage.typeVideoCapture === 'camera' || localStorage.typeVideoCapture === 'desktop')) {
                new FFMPEG_CONVERT().info(nimbus_screen.info.file.patch, function (info) {
                    core.getWaterMark(function (watermark) {
                        if (localStorage.typeWatermark === 'text') {
                            const c = document.createElement('canvas');
                            const ctx = c.getContext("2d");
                            c.width = watermark.width;
                            c.height = watermark.height;
                            console.log(localStorage.colorWatermark, inversion(localStorage.colorWatermark))
                            ctx.fillStyle = inversion(localStorage.colorWatermark);
                            ctx.fillRect(0, 0, watermark.width, watermark.height);
                            ctx.drawImage(watermark, 0, 0, watermark.width, watermark.height);
                            watermark = c;
                        }

                        let x, y, shift = 10;
                        switch (localStorage.positionWatermark) {
                            case 'lt':
                                x = shift;
                                y = shift;
                                break;
                            case 'rt':
                                x = info.quality.width - watermark.width - shift;
                                y = shift;
                                break;
                            case 'lb':
                                x = shift;
                                y = info.quality.height - watermark.height - shift;
                                break;
                            case 'rb':
                                x = info.quality.width - watermark.width - shift;
                                y = info.quality.height - watermark.height - shift;
                                break;
                            case 'c':
                                x = Math.floor((info.quality.width - watermark.width) / 2);
                                y = Math.floor((info.quality.height - watermark.height) / 2);
                                break;
                        }

                        nimbus_screen.dataURLToFile(watermark.toDataURL('image/jpeg', 1), 'watermark.jpg', function () {
                            let params = [];
                            params.push("-i");
                            params.push("/fs/watermark.jpg");
                            params.push("-filter_complex");

                            let flt = "[0:v]scale=" + info.quality.width + ":-2[bg];";
                            flt += "[1:v]scale=" + watermark.width + ":" + watermark.height + "[wm];";
                            flt += "[bg][wm]overlay=" + x + ":" + y;

                            params.push(flt);

                            return cb && cb(true, params)
                        })
                    });
                });
            } else {
                return cb && cb(false, [])
            }
        });
    },
    convert: function (req, cb) {
        $('#nsc_preview_loading').show();
        if ($('#nsc_preview_content').find('video').length) {
            $('#nsc_preview_content').find('video').hide()[0].pause();
        }
        $('#nsc_preview_img').hide();
        console.log('--start convert--', req);

        let params = [];

        params.push("-i");

        if (localStorage.videoReEncoding === 'true') {
            params.push("/fs/video-encode.webm");
        } else {
            params.push("/fs/video.webm");
        }

        if (req.trim) {
            params.push('-ss');
            params.push(req.trim.start);
        }

        if (req.format === 'watermark') {
            params = params.concat(req.params);
            req.format = 'webm';
        } else if (req.size) {
            params.push("-filter:v");
            params.push("scale=" + req.size.width + ":-2");
        }

        if (req.format === 'mp4') {
            params.push("-c:v");
            params.push("libx264");
            params.push("-fflags");
            params.push("+genpts");
            params.push("-r");
            params.push("60");
            params.push("-q:v");
            params.push("10");
            params.push("-crf");
            params.push("20");
            params.push("-cpu-used");
            params.push("7");
            params.push("-threads");
            params.push("7");
            params.push("-preset");
            params.push("ultrafast");
            params.push("-profile:v");
            params.push("baseline");
            params.push("-tune");
            params.push("zerolatency,fastdecode");
            params.push("-x264opts");
            params.push("no-mbtree:sliced-threads:sync-lookahead=0");
            params.push("-level");
            params.push("3.0");
            params.push("-c:a");
            params.push("aac");
            params.push("-b:a");
            params.push("128k");
        } else if (req.format === 'gif') {
            params.push("-pix_fmt");
            params.push("pal8");
            params.push("-r");
            if (req.frame_rate) {
                params.push(req.frame_rate);
            }
        } else if (req.format === 'format'){
            params.push("-c:v");
            params.push("libvpx");
            params.push("-lossless");
            params.push("1");
            params.push("-quality");
            params.push("good");
            params.push("-cpu-used");
            params.push("7");
            params.push("-threads");
            params.push("7");
            params.push("-preset");
            params.push("veryfast");
            params.push("-level");
            params.push("3.0");
            params.push("-qmin");
            params.push("0");
            params.push("-qmax");
            params.push("50");
            params.push("-minrate");
            params.push("1M");
            params.push("-maxrate");
            params.push("1M");
            params.push("-b:v");
            params.push("1M");
            params.push("-c:a");
            params.push("copy");
            params.push("-b:a");
            params.push("128k");
        }

        if (req.trim) {
            params.push('-t');
            params.push(req.trim.duration);
        }

        if (req.crop) {
            params.push('-filter:v');
            params.push('crop="' + req.crop.width + ':' + req.crop.height + ':' + req.crop.left + ':' + req.crop.top + '"');
        }

        params.push("/fs/video-convert." + req.format);

        console.log(params);
        let duration_video = false;
        let ffmpeg_convert = new FFMPEG_CONVERT();
        ffmpeg_convert.start(params, null,
            function (f) {
                if (f) {
                    nimbus_screen.info.file.patch = nacl_module.path + 'video-convert.' + req.format;
                    nimbus_screen.info.file.format = req.format;

                    nimbus_screen.urlToBlob(nimbus_screen.info.file.patch, function (blob) {
                        nimbus_screen.info.file.blob = blob;
                        nimbus_screen.info.file.size = Math.floor(blob.size);
                        $('#nsc_button_youtube').prop("disabled", req.format.toLowerCase() === 'gif').attr('title', req.format.toLowerCase() === 'gif' ? 'Youtube doesn\'t support GIF' : '');
                        nimbus_screen.viewFilePreview();

                        tracker.send(VIDEO_CONVERT);
                        cb && cb()
                    });
                }
            },
            function (msg) {
                console.log(msg);
                if (msg === 'timeout') {
                    nimbus_screen.dom.$preview_loading.find('[data-i18n]').text('Error convert. Please refresh page and try again.');
                } else {
                    ffmpeg_convert.set_active();
                    let duration = msg.match(/^([0-9]+):([0-9]+):([0-9]+)\.([0-9]+)/i);
                    if (duration) {
                        duration_video = +duration[1] * 3600 + +duration[2] * 60 + +duration[3];
                    }
                    let duration_convert = msg.match(/^frame.+([0-9]+):([0-9]+):([0-9]+)\.([0-9]+)/i);
                    if (duration_video && duration_convert) {
                        duration_convert = +duration_convert[1] * 3600 + +duration_convert[2] * 60 + +duration_convert[3];
                        duration_convert = Math.ceil(duration_convert / duration_video * 100) + '%';
                        nimbus_screen.dom.$preview_loading.find('[data-i18n]').text(chrome.i18n.getMessage('labelPreviewLoadingVideo').replace('-', duration_convert));
                    }
                }
            });


    }
};



