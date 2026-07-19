using BusTicketingBackend.Data;
using BusTicketingBackend.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Oracle.ManagedDataAccess.Client;
using System.Data;

namespace BusTicketingBackend.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class NoticeController : ControllerBase
    {
        private readonly AppDbContext _context;

        public NoticeController(AppDbContext context)
        {
            _context = context;
        }

        // GET: api/notice
        // Calls procedure: GET_NOTICES (cursor-based)
        [HttpGet]
        public async Task<ActionResult<IEnumerable<Notice>>> GetNotices()
        {
            var cursorParam = new OracleParameter("p_cursor", OracleDbType.RefCursor, ParameterDirection.Output);
            return await _context.Notices
                .FromSqlRaw("BEGIN GET_NOTICES(:p_cursor); END;", cursorParam)
                .ToListAsync();
        }

        // GET: api/notice/5
        // Calls procedure: GET_NOTICE_BY_ID (cursor-based)
        [HttpGet("{id}")]
        public async Task<ActionResult<Notice>> GetNotice(int id)
        {
            var idParam     = new OracleParameter("p_id",     OracleDbType.Decimal,   id, ParameterDirection.Input);
            var cursorParam = new OracleParameter("p_cursor", OracleDbType.RefCursor, ParameterDirection.Output);

            var notice = (await _context.Notices
                .FromSqlRaw("BEGIN GET_NOTICE_BY_ID(:p_id, :p_cursor); END;", idParam, cursorParam)
                .ToListAsync())
                .FirstOrDefault();

            if (notice == null)
            {
                return NotFound(new { message = "Notice not found." });
            }

            return notice;
        }

        // POST: api/notice
        // Calls procedure: ADD_NOTICE
        [HttpPost]
        public async Task<ActionResult<Notice>> PostNotice([FromBody] Notice notice)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            await _context.Database.ExecuteSqlRawAsync(
                "BEGIN ADD_NOTICE(:p_notice_number, :p_title, :p_content); END;",
                new OracleParameter("p_notice_number", OracleDbType.Varchar2, notice.NoticeNumber, ParameterDirection.Input),
                new OracleParameter("p_title",         OracleDbType.Varchar2, notice.Title,        ParameterDirection.Input),
                new OracleParameter("p_content",       OracleDbType.Varchar2, notice.Content,      ParameterDirection.Input)
            );

            var cursorParam = new OracleParameter("p_cursor", OracleDbType.RefCursor, ParameterDirection.Output);
            var notices = await _context.Notices
                .FromSqlRaw("BEGIN GET_NOTICES(:p_cursor); END;", cursorParam)
                .ToListAsync();

            var createdNotice = notices.FirstOrDefault(n => n.NoticeNumber == notice.NoticeNumber);

            if (createdNotice == null)
            {
                return BadRequest(new { message = "Failed to retrieve created notice." });
            }

            return CreatedAtAction(nameof(GetNotice), new { id = createdNotice.Id }, createdNotice);
        }

        // PUT: api/notice/5
        // Calls procedure: UPDATE_NOTICE
        [HttpPut("{id}")]
        public async Task<IActionResult> PutNotice(int id, [FromBody] Notice notice)
        {
            if (id != notice.Id)
            {
                return BadRequest(new { message = "Notice ID mismatch." });
            }

            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            try
            {
                await _context.Database.ExecuteSqlRawAsync(
                    "BEGIN UPDATE_NOTICE(:p_id, :p_notice_number, :p_title, :p_content); END;",
                    new OracleParameter("p_id",            OracleDbType.Decimal,   id,                   ParameterDirection.Input),
                    new OracleParameter("p_notice_number", OracleDbType.Varchar2,  notice.NoticeNumber,  ParameterDirection.Input),
                    new OracleParameter("p_title",         OracleDbType.Varchar2,  notice.Title,         ParameterDirection.Input),
                    new OracleParameter("p_content",       OracleDbType.Varchar2,  notice.Content,       ParameterDirection.Input)
                );
            }
            catch (DbUpdateConcurrencyException)
            {
                if (!await NoticeExists(id))
                {
                    return NotFound(new { message = "Notice not found." });
                }
                else
                {
                    throw;
                }
            }

            return Ok(new { message = "Notice updated successfully!", notice });
        }

        // DELETE: api/notice/5
        // Calls procedure: DELETE_NOTICE
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteNotice(int id)
        {
            await _context.Database.ExecuteSqlRawAsync(
                "BEGIN DELETE_NOTICE(:p_id); END;",
                new OracleParameter("p_id", OracleDbType.Decimal, id, ParameterDirection.Input)
            );

            return Ok(new { message = "Notice deleted successfully!" });
        }

        private async Task<bool> NoticeExists(int id)
        {
            var idParam     = new OracleParameter("p_id",     OracleDbType.Decimal,   id, ParameterDirection.Input);
            var cursorParam = new OracleParameter("p_cursor", OracleDbType.RefCursor, ParameterDirection.Output);

            var list = await _context.Notices
                .FromSqlRaw("BEGIN GET_NOTICE_BY_ID(:p_id, :p_cursor); END;", idParam, cursorParam)
                .ToListAsync();

            return list.Any();
        }
    }
}
