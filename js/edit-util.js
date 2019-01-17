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
/**
 * Created by hasesanches on 16.12.2016.
 */

var nimbusAccountPopup = (function () {
    var bind = function () {
        var popup = $('#nsc_account_popup');
        popup.unbind();
        popup.find('button.create').on('click', function () {
            popup.hide();
            $('#nsc_popup_register_nimbus').show();
        });
    };
    var init = function () {
        if (!localStorage.getItem("showAccountPopup")) {
            bind();
            nimbusShare.server.user.authState(function (res) {
                if (res.errorCode !== 0 || !res.body || !res.body.authorized) {
                    $('#nsc_account_popup').show();
                }
            });
            localStorage.setItem('showAccountPopup', 'false');
        }
    };
    return {
        init: init
    };
})();

function createCoords(c) {
    $('#screenshotsize').remove();
    $('#screenshotbutton').remove();

    var ns_crop_buttons = $('<div/>', {
        'id': 'screenshotbutton',
        'class': 'ns-crop-buttons bottom'
    });

    $('<button/>', {
        html: '<i></i><span>' + chrome.i18n.getMessage("cropBtnSave") + '</span>',
        'class': 'ns-btn save'
    }).on('click', function () {
        $('#pole_crop').remove();
        jcrop && jcrop.destroy();
        $(document).trigger('redactor_set_tools', nimbus_screen.canvasManager.getTools());
        nimbus_screen.canvasManager.cropImage(c);
    }).appendTo(ns_crop_buttons);

    $('<button/>', {
        html: '<i></i><span>' + chrome.i18n.getMessage("cropBtnCancel") + '</span>',
        'class': 'ns-btn cancel'
    }).on('click', function () {
        $('#pole_crop').remove();
        jcrop && jcrop.destroy();
        $("#nsc_redactor_crop").trigger('click');
    }).appendTo(ns_crop_buttons);

    var drag = $('.jcrop-dragbar').first();
    drag.before('<div id="screenshotsize" class="ns-crop-size"></div>');
    drag.before(ns_crop_buttons);

    showCards(c);
}

function showCards(c) {
    var zoom = nimbus_screen.canvasManager.getZoom();
    var size = nimbus_screen.getEditCanvasSize();
    var z = window.devicePixelRatio || 1;
    $('#screenshotsize').text((Math.round(c.w / zoom) + z) + ' x ' + (Math.round(c.h / zoom) * z));

    if ((c.h + c.y + 60) > (size.h * zoom)) {
        $('#screenshotbutton').css({'bottom': '0', 'top': 'auto'});
    } else {
        $('#screenshotbutton').css({'bottom': 'auto', 'top': '100%'});
    }

    if (c.y < 25) {
        $('#screenshotsize').css({'bottom': 'auto', 'top': '0'});
    } else {
        $('#screenshotsize').css({'bottom': '100%', 'top': 'auto'});
    }
}