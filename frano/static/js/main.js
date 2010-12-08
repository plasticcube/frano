// Copyright (c) 2010 Gennadiy Shafranovich
// Licensed under the MIT license
// see LICENSE file for copying permission.

var symbols = [];

$(function() {
  $("input").attr("autocomplete","off"); 
  
  scanForBannerMessages();
  $("#banner").click(function() {
    $(this).fadeOut();
  })
  
  $('#symbol').autocomplete({ source: symbols });
    
  var lastTransactionType = 'BUY';
  $(".newTransactionType").change(function() {
    var val = $(this).val();
    var isCash = (val == 'DEPOSIT' || val == 'WITHDRAW' || val == 'ADJUST');
    var wasCash = (lastTransactionType == 'DEPOSIT' || lastTransactionType == 'WITHDRAW' || lastTransactionType == 'ADJUST');
    lastTransactionType = val;
    
    if(isCash != wasCash) {
      if(isCash) {
        $(".securitiesField").attr("disabled", "disabled").val("");
        $(".cashField").attr("disabled", "").filter('[type=text]').val("");
      } else {
        $(".securitiesField").attr("disabled", "").val("");
        $(".cashField").attr("disabled", "disabled").filter('[type=text]').val("");
      }
    }
    
    $(".securitiesField").each(function (idx, obj) { $.validationEngine.closePrompt(obj) });
    $(".cashField").each(function (idx, obj) { $.validationEngine.closePrompt(obj) });
  });
  
  $("#addTransactionForm input").keypress(function(e) {
    if(e.keyCode == 13) {
      e.preventDefault()
      $("#addTransactionForm").submit();
    }
  });
  
  $("#quantity, #price, #comission").change(function() {
    $('#total').val((valueToFloat('#quantity', 0.0) * valueToFloat('#price', 0.0)) + valueToFloat('#comission', 0.0));
  });
  
  $("#addTransaction").click(function () {
    $("#addTransactionForm").submit();
  });
  
  $("#addTransactionForm").submit(function (e) {
    var val = '';
    $(".newTransactionType").each(function (idx, obj) {
      if($(obj).attr("checked")) {
        val = $(obj).val();
      }
    });
    
    var fields;
    if(val == 'DEPOSIT' || val == 'WITHDRAW' || val == 'ADJUST') {
      fields = $(".cashField").filter('[type=text]');
    } else {
      fields = $(".securitiesField");
    }
    
    var valid = true;
    fields.each(function(idx, obj) {
      valid = valid && !$.validationEngine.loadValidation(obj);
    });
    
    if(!valid) {
      e.preventDefault();
    }
  });
  
  $("#priceLookup").click(function() {
    var asOf = new Date($('#as_of_date').val());
    if(asOf.toString() == 'NaN' || asOf.toString() == 'Invalid Date') {
      return;
    }
    
    var symbol = $('#symbol').val().trim();
    if(symbol == null || symbol == '') {
      return;
    }
    
    $.getJSON('/priceQuote.json', { day: asOf.getDate(), month: asOf.getMonth() + 1, year: asOf.getFullYear(), symbol: symbol }, function(data, textStatus) {
      if(textStatus == 'success' && data.price > 0) {
        $('#price').val(data.price);
        $('#total').val((valueToFloat('#quantity', 0.0) * valueToFloat('#price', 0.0)) + valueToFloat('#comission', 0.0));
      }
    });
    
  });
  
  $(".deleteTransaction").click(function (e) {
    if(!confirm('Are you sure you want to remove this transaction?')) {
      e.preventDefault();
    }
  });
  
  $(".removeAllTransactions").click(function (e) {
    if(!confirm('Are you sure you want to remove ALL transactions from this portfolio?\nThis action cannot be undone.')) {
      e.preventDefault();
    }
  });
  
  $("#seeAllTransactions A").click(function(e) {
    e.preventDefault();
    $(".transactionRow").show();
    $("#seeAllTransactions").hide();
  });
  
  $(".editable-transaction-field").each(function() {
    var holder = $(this)
    var components = holder.attr("id").substring('edit_'.length).split('_');
    holder.editable(function(value, settings) {
      var params = Object();
      params[components[2]] = value;
      $.post('/' + components[0] + '/' + components[1] + '/' + 'update.json', params, function(data, textStatus) {
        if(data.success == 'True') {
          val = 'Saved';
        } else {
          alert("Something went wrong...sorry");
          val = 'Failed';
        }
        
        holder.editable('disable');
        holder.unbind('click');
        holder.html(val);
        holder.siblings(".inline-editable-prompt").html("refresh to update");
        
      }, 'json');
      
      return "Saving..."
    }, {
      onblur    : 'submit',
      height    : 17,
      width     : parseInt(components[3]),
      style     : 'display: inline;',
      data      : function(value, settings) { return value.replace(/[,\$]/gi, ''); }
    });
  });
  
  $(".transactionType").each(function() {
    var holder = $(this)
    var components = holder.attr("id").substring('edit_'.length).split('_');
    holder.editable(function(value, settings) {
      var params = Object();
      $.post('/' + components[0] + '/' + components[1] + '/' + 'update.json', { type : value }, function(data, textStatus) {
        if(data.success == 'True') {
          val = 'Saved';
        } else {
          alert("Something went wrong...sorry");
          val = 'Failed';
        }
        
        holder.editable('disable');
        holder.unbind('click');
        holder.html(val);
        holder.siblings(".inline-editable-prompt").html("refresh to update");
        
      }, 'json');
      
      return "Saving..."
    }, {
      onblur    : 'submit',
      type      : 'select',
      style     : 'display: inline;',
      data      : function (value, settings) {
        if(value == 'BUY' || value == 'SELL') {
          return { 'BUY' : 'Buy Securities', 'SELL' : 'Sell Securities', 'selected' : value };
        } else {
          return { 'DEPOSIT' : 'Deposit Cash', 'WITHDRAW' : 'Withdraw Cash', 'ADJUST' : 'Adjust Cash', 'selected' : value };
        }
      }
    });
  });
  
  $(".inline-editable").mouseenter(function() { toggleEditPrompt($(this), ".inline-editable-prompt", true); });
  $(".inline-editable").mouseleave(function() { toggleEditPrompt($(this), ".inline-editable-prompt", false); });
  $(".inline-editable").click(function() { toggleEditPrompt($(this), ".inline-editable-prompt", false); });
  
  $("#editPortfolioName").click(function(e) {
    e.preventDefault();
    $("SELECT.selectPortfolio,#editPortfolioName").hide();
    $("#portfolioNameForm").css("display", 'inline');
    $("INPUT.selectPortfolio").focus();
  });
  
  $("#cancelPortfolioName").click(function (e) {
    e.preventDefault();
    $("#portfolioNameForm").hide();
    $("SELECT.selectPortfolio,#editPortfolioName").show();
  });
  
  $("#setPortfolioName").click(function (e) {
    e.preventDefault();
    var id = $(this).val();
    var value = $("INPUT.selectPortfolio").val();
    $.post('/' + id + '/setName.json', { name : value }, function(data, textStatus) {
      if(data.success != 'True') {
        alert("Something went wrong...sorry");
        return;
      }
      
      var dropdown = $(".selectPortfolio").get(0);
      $(dropdown.options[dropdown.selectedIndex]).html(value);
      
      $("#portfolioNameForm").hide();
      $("SELECT.selectPortfolio,#editPortfolioName").show();
    }, 'json');
  });
  
  var previousSelectedPortfolio;
  $("SELECT.selectPortfolio").focus(function() {
    previousSelectedPortfolio = $(this).val();
  }).change(function () {
    if ($(this).val() == '') {
      location.href = "/demo.html"
    } else {
      var tester = new RegExp("^(.*/)" + previousSelectedPortfolio + "(/\\w+\\.html)$", "gi");
      if(tester.exec(location.href) != null) {
        location.href = location.href.replace(tester, "$1" + $(this).val() + "$2")
      } else {
        location.href = "/" + $(this).val() + "/positions.html"
      }
    }
  });
  
  $("#deletePortfolio").click(function (e) {
    if(!confirm('Are you sure you want to remove this portfolio?')) {
      e.preventDefault();
    }
  });
  
  $(".showImportRequestForm").click(function(e) {
    e.preventDefault();
    $("#importTransactionsForm").hide();
    $("#requestTransactionsForm").show();
  });
  
  $("#cancelImportRequest").click(function(e) {
    e.preventDefault();
    $("#requestTransactionsForm").hide();
    $("#importTransactionsForm").show();
    
  });
  
  $("#transactionSymbolFilter").change(function() {
    $(this).submit();
  });
  
});

function scanForBannerMessages() {
  var msg = $('.message').first()
  if(msg.length > 0) {
    $("#banner").html(msg.html() + " &nbsp;&nbsp;<a onclick='return false;' href='#'>Close</a>");
    $("#banner").fadeIn(function() {
        window.setTimeout('$("#banner").fadeOut(1000)',4500);
    
    });
    
  }
}

function valueToFloat(selector, defaultValue) {
  var out = parseFloat($(selector).val());
  return (isNaN(out) ? defaultValue : out);
}

function toggleEditPrompt(holder, promptClass,  state) {
  var prompt = holder.siblings(promptClass);
  if(holder.children('form').length == 0 && state) {
    prompt.css("visibility", "visible");
  } else {
    prompt.css("visibility", "hidden");
  }
}

function initializeProfitLossChart(container) {
  var dataPercent = []
  var benchmarkPercent = []
  for(var i = 0; i < profitLossPercent.length; i++) {
    dataPercent[i] = [ i, profitLossPercent[i] ]
    benchmarkPercent[i] = [ i, benchmark[i] ]
  }
  
  $.plot(container,
    [ 
      { data: dataPercent, yaxis: 2, label: "P/L %" },
      { data: benchmarkPercent, yaxis: 2, label: 'Benchmark (' + benchmarkSymbol + ')' },
    ],
    {
      series: {
        lines: { show: true },
      },
      xaxis: {
        ticks: dates.length / 7,
        minTickSize: 1,
        tickFormatter: function (value, axis) {
          if(value >= 0 && value < dates.length) {
            return $.datepicker.formatDate('mm/dd', dates[value]);
          }
        }
      },
      y2axis: {
        tickFormatter: function (value, axis) {
          return (value * 100).toFixed(2) + "%";
        }
      },
      grid: {
        backgroundColor: { colors: ["#ffffff", "#eeeeee"] },
      },
      legend: {
        show: true,
        position: 'nw',
        backgroundColor: '#FFFFFF',
        opacity: 0.8
      }
    });
}

function initializeAllocationChart(container) {
  data = []
  for (var i = 0; i < allocation.length; i++) {
    data[i] = { label: allocation[i][0], data: allocation[i][1] }
  }
  
  $.plot(container, 
      data, 
      {
        series: {
          pie: { 
            show: true, 
            radius: 0.98,
            label: {
                show: true,
                radius: 0.8,
                formatter: function(label, series) {
                    return '<div style="font-size:8pt;text-align:center;padding:2px;color:white; border: 1px solid #ccc;">'+label+'<br/>'+series.percent.toFixed(2)+'%</div>';
                },
                background: { opacity: 0.5, color: '#666' }
            },
            combine: {
              threshold: 0.05
            }
          },
        },
        legend: {
          show: false
        }
      }
    );
}
