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

(function ($) {

    if (!window.thisFragment) {
        let captureCrop = {
            init: function () {
                window.thisCrop = false;
            }
        }
    }


    let positionLoupe = {x: 0, y: 0};
    let format = 'png';
    let quality = 90;
    let imgdata;

    function showLoupe(e) {
        let loupe = $("#nsc_crop_loupe");

        if (loupe.is(":hidden")) return;

        let img = document.getElementById('nsc_crop_image');
        let canvas = document.getElementById('nsc_crop_loupe_canvas');
        let context = canvas.getContext('2d');
        let wi = document.documentElement.clientWidth;
        let hi = document.documentElement.clientHeight;
        let z = window.core.is_chrome ? window.devicePixelRatio : 1;
        let x = (e.clientX - 15) * z;
        let y = (e.clientY - 15) * z;
        let h = 30;
        let w = 30;
        let x2 = 0;
        let y2 = 0;
        let lh = loupe.height() + 20;
        let lw = loupe.width() + 20;
        let s = loupe.find('span');

        if (e.clientX < lw + 5 && e.clientY < lh + 5) {
            positionLoupe = {x: wi - lw - 10, y: hi - lh - 10};
        }
        if (e.clientX > (wi - lw - 5) && e.clientY > (hi - lh - 5)) {
            positionLoupe = {x: 0, y: 0};
        }

        loupe.css({top: positionLoupe.y + 10, left: positionLoupe.x + 10});
        $(s[0]).html('X = ' + e.clientX);
        $(s[1]).html('Y = ' + e.clientY);

        context.canvas.width = 240;
        context.canvas.height = 240;

        if (x < 0) {
            x2 = (-8) * x;
            x = 0;
        }
        if (y < 0) {
            y2 = (-8) * y;
            y = 0;
        }
        if ((e.clientX + 15) > wi) {
            w = wi - e.clientX + 14;
        }
        if ((e.clientY + 15) > hi) {
            h = hi - e.clientY + 14;
        }

        let zoom = 8;
        let offctx = document.createElement('canvas').getContext('2d');
        offctx.drawImage(img, x, y, w, h, 0, 0, w, h);
        let imgDt = offctx.getImageData(0, 0, w, h).data;

        for (let xx = 0; xx < w; ++xx) {
            for (let yy = 0; yy < h; ++yy) {
                let i = (yy * w + xx) * 4;
                let r = imgDt[i];
                let g = imgDt[i + 1];
                let b = imgDt[i + 2];
                let a = imgDt[i + 3];
                context.fillStyle = "rgba(" + r + "," + g + "," + b + "," + (a / 255) + ")";
                context.fillRect(x2 + xx * zoom, y2 + yy * zoom, zoom, zoom);
            }
        }
        context.lineWidth = 1;
        context.strokeStyle = "#FF6600";
        context.beginPath();
        context.moveTo(120, 0);
        context.lineTo(120, 240);
        context.moveTo(0, 120);
        context.lineTo(240, 120);
        context.stroke();
    }

    function destroyCrop() {
        $('#nsc_crop').remove();
        $('html').css("overflow", "auto");
        window.thisCrop = false;
    }

    function cropImage(parameters) {
        let img = new Image();
        img.src = document.getElementById('nsc_crop_image').src;
        img.onload = function () {
            let canvas = document.createElement('canvas');
            let context = canvas.getContext('2d');
            let z = window.core.is_chrome ? window.devicePixelRatio : 1;

            canvas.width = parameters.w * z;
            canvas.height = parameters.h * z;
            context.drawImage(img, parameters.x * z, parameters.y * z, parameters.w * z, parameters.h * z, 0, 0, parameters.w * z, parameters.h * z);
            imgdata = canvas.toDataURL('image/' + (format === 'jpg' ? 'jpeg' : 'png'), quality / 100);

            chrome.runtime.sendMessage({operation: 'set_screen', dataUrl: imgdata});
        };
    }

    function createCoords(parameters) {
        chrome.runtime.sendMessage({operation: 'save_crop_position', position: parameters});

        if ($("#screenshotbutton").length || $("#screenshotsize").length) {
            return;
        }

        let ns_crop_buttons = $('<div/>', {
            'id': 'screenshotbutton',
            'class': 'ns-crop-buttons bottom'
        });

        $('<button/>', {
            html: '<i></i><span>' + chrome.i18n.getMessage("cropBtnEdit") + '</span>',
            'class': 'ns-btn edit'
        }).on('click', function () {
            chrome.runtime.sendMessage({operation: 'open_edit_page'});
            destroyCrop();
        }).appendTo(ns_crop_buttons);


        $('<button/>', {
            html: '<i></i><span>' + chrome.i18n.getMessage("cropBtnSave") + '</span>',
            'class': 'ns-btn save'
        }).on('click', function () {
            chrome.runtime.sendMessage({operation: 'download_screen_content'});
            destroyCrop();
        }).appendTo(ns_crop_buttons);


        $('<button/>', {
            html: '<i></i><span>' + chrome.i18n.getMessage("cropBtnCancel") + '</span>',
            'class': 'ns-btn cancel'
        }).on('click', function () {
            destroyCrop();
        }).appendTo(ns_crop_buttons);

        let ns_crop_more = $('<div/>', {
            html: '<button></button>',
            'id': 'ns_crop_more',
            'class': 'ns-crop-more'
        });

        let ns_more_container = $('<div/>', {
            'id': 'ns_more_container',
            'class': 'ns-crop-more-container'
        });

        $('<button/>', {
            html: '<span>Nimbus</span>',
            'class': 'ns-btn nimbus'
        }).on('click', function () {
            chrome.runtime.sendMessage({operation: 'send_to', path: 'nimbus'});
            destroyCrop();
        }).appendTo(ns_more_container);

        $('<button/>', {
            html: '<span>Slack</span>',
            'class': 'ns-btn slack'
        }).on('click', function () {
            chrome.runtime.sendMessage({operation: 'send_to', path: 'slack'});
            destroyCrop();
        }).appendTo(ns_more_container);

        $('<button/>', {
            html: '<span>Google Drive</span>',
            'class': 'ns-btn google'
        }).on('click', function () {
            chrome.runtime.sendMessage({operation: 'send_to', path: 'google'});
            destroyCrop();
        }).appendTo(ns_more_container);

        $('<button/>', {
            html: '<span>Print</span>',
            'class': 'ns-btn print'
        }).on('click', function () {
            chrome.runtime.sendMessage({operation: 'send_to', path: 'print'});
            destroyCrop();
        }).appendTo(ns_more_container);

        if (window.core.is_firefox) {
            $('<button/>', {
                html: '<span>' + chrome.i18n.getMessage("cropBtnCopy") + '</span>',
                'class': 'ns-btn copy'
            }).on('click', function () {
                chrome.runtime.sendMessage({operation: 'copy_to_clipboard', dataUrl: imgdata});
                destroyCrop();
            }).appendTo(ns_more_container);
        }

        ns_crop_more.append(ns_more_container);

        let drag = $('.jcrop-dragbar').first();
        drag.before('<div id="screenshotsize" class="ns-crop-size"></div>');
        drag.before(ns_crop_buttons);
        drag.before(ns_crop_more);

        let loupe = $('#nsc_crop_loupe');
        let events = {
            'mouseenter': loupe.show,
            'mouseleave': loupe.hide
        };
        $(".jcrop-handle").bind(events);
        $(".jcrop-dragbar").bind(events);
        $(".jcrop-tracker").last().bind(events);

        showCoords(parameters);
    }

    function showCoords(parameters) {
        cropImage(parameters);

        let z = window.core.is_chrome ? window.devicePixelRatio : 1;
        $('#screenshotsize').text((parameters.w * z) + ' x ' + (parameters.h * z));

        if ((parameters.h + parameters.y + 60) > $(window).height()) {
            $('#screenshotbutton').css({'bottom': '0', 'top': 'auto'});
            $('#ns_crop_more').css({'bottom': '0', 'top': 'auto'});
        } else {
            $('#screenshotbutton').css({'bottom': 'auto', 'top': '100%'});
            $('#ns_crop_more').css({'bottom': 'auto', 'top': '100%'});
        }

        if (parameters.w < 325) $('#ns_crop_more').css({'bottom': '0', 'top': 'auto'});

        if (parameters.y < 25) $('#screenshotsize').css({'bottom': 'auto', 'top': '0'});
        else $('#screenshotsize').css({'bottom': '100%', 'top': 'auto'});
    }

    if (!window.screencaptureinit) {
        window.screencaptureinit = true;

        chrome.runtime.onMessage.addListener(function (req) {
            if (req.operation === 'capture_selected') {
                window.thisCrop = true;

                chrome.runtime.sendMessage({operation: 'get_info_screen'}, function (response) {
                    format = response.format;
                    quality = response.quality;
                });

                $('html').css("overflow", "hidden");
                let nsc_crop = jQuery('<div/>', {id: 'nsc_crop'}).appendTo('body');
                let nsc_crop_image = jQuery('<img/>', {id: 'nsc_crop_image', src: req.image}).appendTo(nsc_crop);
                let jcrop = $.Jcrop($(nsc_crop_image), {onSelect: createCoords, onChange: showCoords});

                chrome.runtime.sendMessage({operation: 'get_crop_position'}, function (response) {
                    if (response.x && response.y && response.x2 && response.y2) {
                        jcrop.setSelect([response.x, response.y, response.x2, response.y2]);
                    }
                });

                nsc_crop.append('<div id="nsc_crop_loupe"><canvas id="nsc_crop_loupe_canvas"></canvas><span>X = 0</span><span>Y = 0</span></div>');

                nsc_crop.bind({
                    'mousemove': function (e) {
                        showLoupe(e);
                    },
                    'mouseenter': function (e) {
                        $('#nsc_crop_loupe').show();
                    },
                    'mouseleave': function (e) {
                        $('#nsc_crop_loupe').hide();
                    }
                });

                window.addEventListener('keydown', function (evt) {
                    evt = evt || window.event;
                    if (evt.keyCode === 27) {
                        destroyCrop();
                    }
                }, false);
            }
        });
    }
}(jQuery));